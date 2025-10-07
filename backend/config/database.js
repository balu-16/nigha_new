import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

// Utility function to get current IST timestamp
const getISTTimestamp = () => {
  const now = new Date();
  // Convert to IST (UTC + 5:30)
  const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
  const istTime = new Date(now.getTime() + istOffset);
  return istTime.toISOString().replace('T', ' ').substring(0, 19); // Format: YYYY-MM-DD HH:MM:SS
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file path
const dbPath = path.join(__dirname, '..', 'data', 'nightech.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Promisify database methods with proper this context
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) return reject(err);
      resolve(this); // 'this' contains lastID and changes properties
    });
  });
};
const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Create database schema
const createTables = async () => {
  console.log('Creating database tables...');

  try {
    // Users table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE,
        role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'superadmin')),
        created_at DATETIME DEFAULT (datetime('now', '+05:30'))
      )
    `);

    // OTP Sessions table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS otp_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        phone_number TEXT NOT NULL,
        otp_code TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT (datetime('now', '+05:30')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Devices table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS devices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_code TEXT UNIQUE NOT NULL,
        device_name TEXT NOT NULL,
        assigned_to INTEGER,
        qr_code BLOB,
        created_at DATETIME DEFAULT (datetime('now', '+05:30')),
        FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Login logs table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS login_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_id INTEGER NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        login_time DATETIME DEFAULT (datetime('now', '+05:30')),
        FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Device sharing table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS device_shared_with (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id INTEGER NOT NULL,
        shared_with_user_id INTEGER NOT NULL,
        shared_at DATETIME DEFAULT (datetime('now', '+05:30')),
        FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
        FOREIGN KEY (shared_with_user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Telemetry tables
    await dbRun(`
      CREATE TABLE IF NOT EXISTS pressure_readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id INTEGER NOT NULL,
        pressure1 REAL,
        pressure2 REAL,
        recorded_at DATETIME DEFAULT (datetime('now', '+05:30')),
        FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
      )
    `);

    await dbRun(`
      CREATE TABLE IF NOT EXISTS temperature_readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id INTEGER NOT NULL,
        temperature REAL,
        recorded_at DATETIME DEFAULT (datetime('now', '+05:30')),
        FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
      )
    `);

    await dbRun(`
      CREATE TABLE IF NOT EXISTS distance_readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id INTEGER NOT NULL,
        distance REAL,
        recorded_at DATETIME DEFAULT (datetime('now', '+05:30')),
        FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
      )
    `);

    // Add additional columns to existing devices table if they don't exist
    try {
      await dbRun(`ALTER TABLE devices ADD COLUMN device_m2m_number TEXT`);
      console.log('Added device_m2m_number column to devices table');
    } catch (error) {
      if (!error.message.includes('duplicate column name')) {
        console.error('Error adding device_m2m_number column:', error);
      }
    }



    // Remove allocated_to_customer_id column migration
    try {
      // Check if allocated_to_customer_id column exists
      const tableInfo = await dbAll(`PRAGMA table_info(devices)`);
      const hasAllocatedColumn = tableInfo.some(col => col.name === 'allocated_to_customer_id');
      
      if (hasAllocatedColumn) {
        console.log('Removing allocated_to_customer_id column from devices table...');
        
        // Create new table without allocated_to_customer_id
        await dbRun(`
          CREATE TABLE devices_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_code TEXT UNIQUE NOT NULL,
            device_name TEXT NOT NULL,
            assigned_to INTEGER,
            qr_code BLOB,
            device_m2m_number TEXT,
            allocated_at DATETIME,
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT (datetime('now', '+05:30')),
            FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
          )
        `);
        
        // Copy data from old table to new table (excluding allocated_to_customer_id)
        await dbRun(`
          INSERT INTO devices_new (id, device_code, device_name, assigned_to, qr_code, device_m2m_number, allocated_at, is_active, created_at)
          SELECT id, device_code, device_name, assigned_to, qr_code, device_m2m_number, allocated_at, is_active, created_at
          FROM devices
        `);
        
        // Drop old table and rename new table
        await dbRun(`DROP TABLE devices`);
        await dbRun(`ALTER TABLE devices_new RENAME TO devices`);
        
        console.log('Successfully removed allocated_to_customer_id column from devices table');
      }
    } catch (error) {
      console.error('Error removing allocated_to_customer_id column:', error);
    }

    try {
      await dbRun(`ALTER TABLE devices ADD COLUMN allocated_at DATETIME`);
      console.log('Added allocated_at column to devices table');
    } catch (error) {
      if (!error.message.includes('duplicate column name')) {
        console.error('Error adding allocated_at column:', error);
      }
    }

    try {
      await dbRun(`ALTER TABLE devices ADD COLUMN is_active BOOLEAN DEFAULT 1`);
      console.log('Added is_active column to devices table');
    } catch (error) {
      if (!error.message.includes('duplicate column name')) {
        console.error('Error adding is_active column:', error);
      }
    }

    // Add qr_code column to existing devices table if it doesn't exist
    try {
      await dbRun(`ALTER TABLE devices ADD COLUMN qr_code BLOB`);
      console.log('Added qr_code column to devices table');
    } catch (error) {
      // Column already exists, ignore the error
      if (!error.message.includes('duplicate column name')) {
        console.error('Error adding qr_code column:', error);
      }
    }

    console.log('Database tables created successfully');
    await insertDefaultUsers();
  } catch (error) {
    console.error('Error creating tables:', error);
  }
};

// Insert default users
const insertDefaultUsers = async () => {
  try {
    // Check if superadmin exists
    const superadmin = await dbGet('SELECT * FROM users WHERE role = "superadmin"');
    
    if (!superadmin) {
      await dbRun(
        'INSERT INTO users (name, phone, email, role) VALUES (?, ?, ?, ?)',
        ['Super Admin', '9999999999', 'superadmin@nightech.com', 'superadmin']
      );
      console.log('Default superadmin created');
    }

    // Check if admin exists
    const admin = await dbGet('SELECT * FROM users WHERE role = "admin" AND phone = "8888888888"');
    
    if (!admin) {
      await dbRun(
        'INSERT INTO users (name, phone, email, role) VALUES (?, ?, ?, ?)',
        ['Admin User', '8888888888', 'admin@nightech.com', 'admin']
      );
      console.log('Default admin created');
    }
  } catch (error) {
    console.error('Error inserting default users:', error);
  }
};

// Initialize database
createTables();

// Database helper functions
export const dbHelpers = {
  // User operations
  async createUser(name, phone, email, role = 'customer') {
    return await dbRun(
      'INSERT INTO users (name, phone, email, role) VALUES (?, ?, ?, ?)',
      [name, phone, email, role]
    );
  },

  async getUserByPhone(phone) {
    return await dbGet('SELECT * FROM users WHERE phone = ?', [phone]);
  },

  async getUserById(id) {
    return await dbGet('SELECT * FROM users WHERE id = ?', [id]);
  },

  async getAllUsers() {
    return await dbAll('SELECT id, name, phone, email, role, created_at FROM users ORDER BY created_at DESC');
  },

  async updateUserRole(userId, role) {
    return await dbRun('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
  },

  async deleteUser(userId) {
    return await dbRun('DELETE FROM users WHERE id = ?', [userId]);
  },

  // OTP operations
  async storeOTP(userId, phoneNumber, otpCode, expiresAt) {
    return await dbRun(
      'INSERT INTO otp_sessions (user_id, phone_number, otp_code, expires_at) VALUES (?, ?, ?, ?)',
      [userId, phoneNumber, otpCode, expiresAt]
    );
  },

  async invalidateOTPs(phoneNumber) {
    return await dbRun(
      'UPDATE otp_sessions SET is_verified = TRUE WHERE phone_number = ? AND is_verified = FALSE',
      [phoneNumber]
    );
  },

  async verifyOTP(phoneNumber, otpCode) {
    // Get current IST time in the same format as stored expires_at
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST offset
    const currentIST = new Date(now.getTime() + istOffset);
    const currentISTString = currentIST.toISOString().replace('T', ' ').substring(0, 19);
    
    return await dbGet(
      `SELECT * FROM otp_sessions 
       WHERE phone_number = ? AND otp_code = ? AND is_verified = FALSE AND expires_at > ?
       ORDER BY created_at DESC LIMIT 1`,
      [phoneNumber, otpCode, currentISTString]
    );
  },

  async markOTPVerified(id) {
    return await dbRun('UPDATE otp_sessions SET is_verified = TRUE WHERE id = ?', [id]);
  },

  async cleanupExpiredOTPs() {
    return await dbRun('DELETE FROM otp_sessions WHERE expires_at < datetime("now", "+05:30")');
  },

  async getOTPStats() {
    return await dbGet(
      'SELECT COUNT(*) as total_sessions FROM otp_sessions WHERE created_at > datetime("now", "-24 hours")'
    );
  },

  // Device operations
  async createDevice(deviceCode, deviceName, assignedTo = null) {
    return await dbRun(
      'INSERT INTO devices (device_code, device_name, assigned_to) VALUES (?, ?, ?)',
      [deviceCode, deviceName, assignedTo]
    );
  },

  async createDeviceWithQR(deviceCode, deviceName, assignedTo = null, qrCodeBuffer = null) {
    return await dbRun(
      'INSERT INTO devices (device_code, device_name, assigned_to, qr_code) VALUES (?, ?, ?, ?)',
      [deviceCode, deviceName, assignedTo, qrCodeBuffer]
    );
  },

  async getDevicesByUser(userId) {
    return await dbAll('SELECT * FROM devices WHERE assigned_to = ? ORDER BY created_at DESC', [userId]);
  },

  async getAllDevices() {
    return await dbAll(
      `SELECT d.*, u.name as assigned_user_name 
       FROM devices d 
       LEFT JOIN users u ON d.assigned_to = u.id 
       ORDER BY d.created_at DESC`
    );
  },

  async getDeviceByCode(deviceCode) {
    return await dbGet('SELECT * FROM devices WHERE device_code = ?', [deviceCode]);
  },

  async getDeviceById(deviceId) {
    return await dbGet('SELECT * FROM devices WHERE id = ?', [deviceId]);
  },

  async assignDevice(deviceId, userId) {
    return await dbRun('UPDATE devices SET assigned_to = ? WHERE id = ?', [userId, deviceId]);
  },

  async unassignDevice(deviceId) {
    return await dbRun('UPDATE devices SET assigned_to = NULL WHERE id = ?', [deviceId]);
  },

  async deleteDevice(deviceId) {
    return await dbRun('DELETE FROM devices WHERE id = ?', [deviceId]);
  },

  async updateDeviceM2MNumber(deviceId, m2mNumber) {
    return await dbRun('UPDATE devices SET device_m2m_number = ? WHERE id = ?', [m2mNumber, deviceId]);
  },

  async getDeviceStats() {
    const total = await dbGet('SELECT COUNT(*) as count FROM devices');
    const assigned = await dbGet('SELECT COUNT(*) as count FROM devices WHERE assigned_to IS NOT NULL');
    return {
      total: total.count,
      assigned: assigned.count,
      unassigned: total.count - assigned.count
    };
  },

  // Login log operations
  async createLoginLog(adminId, ipAddress, userAgent) {
    return await dbRun(
      'INSERT INTO login_logs (admin_id, ip_address, user_agent) VALUES (?, ?, ?)',
      [adminId, ipAddress, userAgent]
    );
  },

  async getLoginLogs(limit = 50) {
    return await dbAll(
      `SELECT l.*, u.name as admin_name, u.phone as admin_phone 
       FROM login_logs l 
       JOIN users u ON l.admin_id = u.id 
       ORDER BY l.login_time DESC 
       LIMIT ?`,
      [limit]
    );
  },

  async getRecentLoginCount() {
    return await dbGet(
      'SELECT COUNT(*) as count FROM login_logs WHERE login_time > datetime("now", "-24 hours")'
    );
  },

  // User stats
  async getUserStats() {
    const customers = await dbGet('SELECT COUNT(*) as count FROM users WHERE role = "customer"');
    const admins = await dbGet('SELECT COUNT(*) as count FROM users WHERE role = "admin"');
    const superadmins = await dbGet('SELECT COUNT(*) as count FROM users WHERE role = "superadmin"');
    
    return {
      customers: customers.count,
      admins: admins.count,
      superadmins: superadmins.count,
      total: customers.count + admins.count + superadmins.count
    };
  },

  // Customer device operations
  async assignDeviceToCustomer(deviceCode, customerId, deviceName = null) {
    const device = await dbGet('SELECT * FROM devices WHERE device_code = ?', [deviceCode]);
    if (!device) {
      throw new Error('Device not found');
    }
    if (device.assigned_to) {
      throw new Error('Device already allocated');
    }
    
    const updateName = deviceName || device.device_name;
    return await dbRun(
      'UPDATE devices SET assigned_to = ?, allocated_at = datetime("now", "+05:30"), device_name = ?, is_active = 1 WHERE device_code = ?',
      [customerId, updateName, deviceCode]
    );
  },

  async getCustomerDevices(customerId) {
    return await dbAll(
      'SELECT * FROM devices WHERE assigned_to = ? AND is_active = 1 ORDER BY allocated_at DESC',
      [customerId]
    );
  },

  async shareDevice(deviceId, sharedWithUserId) {
    // Check if device exists and is allocated to a customer
    const device = await dbGet('SELECT * FROM devices WHERE id = ? AND assigned_to IS NOT NULL', [deviceId]);
    if (!device) {
      throw new Error('Device not found or not allocated');
    }
    
    // Check if already shared with this user
    const existingShare = await dbGet(
      'SELECT * FROM device_shared_with WHERE device_id = ? AND shared_with_user_id = ?',
      [deviceId, sharedWithUserId]
    );
    if (existingShare) {
      throw new Error('Device already shared with this user');
    }
    
    return await dbRun(
      'INSERT INTO device_shared_with (device_id, shared_with_user_id) VALUES (?, ?)',
      [deviceId, sharedWithUserId]
    );
  },

  async getSentDevices(customerId) {
    return await dbAll(
      `SELECT d.device_name, d.device_code, u.name as username, u.id as user_id, s.shared_at 
       FROM device_shared_with s 
       JOIN devices d ON s.device_id = d.id 
       JOIN users u ON s.shared_with_user_id = u.id 
       WHERE d.assigned_to = ? 
       ORDER BY s.shared_at DESC`,
      [customerId]
    );
  },

  async getReceivedDevices(customerId) {
    return await dbAll(
      `SELECT d.device_name, d.device_code, o.name as owner, s.shared_at 
       FROM device_shared_with s 
       JOIN devices d ON s.device_id = d.id 
       JOIN users o ON d.assigned_to = o.id 
       WHERE s.shared_with_user_id = ? 
       ORDER BY s.shared_at DESC`,
      [customerId]
    );
  },

  async getCustomerUsers() {
    return await dbAll('SELECT id, name, phone FROM users WHERE role = "customer" ORDER BY name');
  },

  // Telemetry operations
  async getPressureReadings(deviceId, limit = 50) {
    return await dbAll(
      'SELECT pressure1, pressure2, recorded_at FROM pressure_readings WHERE device_id = ? ORDER BY recorded_at DESC LIMIT ?',
      [deviceId, limit]
    );
  },

  async getTemperatureReadings(deviceId, limit = 50) {
    return await dbAll(
      'SELECT temperature, recorded_at FROM temperature_readings WHERE device_id = ? ORDER BY recorded_at DESC LIMIT ?',
      [deviceId, limit]
    );
  },

  async getDistanceReadings(deviceId, limit = 50) {
    return await dbAll(
      'SELECT distance, recorded_at FROM distance_readings WHERE device_id = ? ORDER BY recorded_at DESC LIMIT ?',
      [deviceId, limit]
    );
  },

  async getLatestPressureReading(deviceId) {
    return await dbGet(
      'SELECT pressure1, pressure2, recorded_at FROM pressure_readings WHERE device_id = ? ORDER BY recorded_at DESC LIMIT 1',
      [deviceId]
    );
  },

  async getLatestTemperatureReading(deviceId) {
    return await dbGet(
      'SELECT temperature, recorded_at FROM temperature_readings WHERE device_id = ? ORDER BY recorded_at DESC LIMIT 1',
      [deviceId]
    );
  },

  async getLatestDistanceReading(deviceId) {
    return await dbGet(
      'SELECT distance, recorded_at FROM distance_readings WHERE device_id = ? ORDER BY recorded_at DESC LIMIT 1',
      [deviceId]
    );
  },

  // Helper functions to insert sample telemetry data for testing
  async insertPressureReading(deviceId, pressure1, pressure2) {
    return await dbRun(
      'INSERT INTO pressure_readings (device_id, pressure1, pressure2) VALUES (?, ?, ?)',
      [deviceId, pressure1, pressure2]
    );
  },

  async insertTemperatureReading(deviceId, temperature) {
    return await dbRun(
      'INSERT INTO temperature_readings (device_id, temperature) VALUES (?, ?)',
      [deviceId, temperature]
    );
  },

  async insertDistanceReading(deviceId, distance) {
    return await dbRun(
      'INSERT INTO distance_readings (device_id, distance) VALUES (?, ?)',
      [deviceId, distance]
    );
  },



  // Clear all devices and related data (for testing purposes)
  async clearAllDevices() {
    try {
      // Delete all telemetry data first (due to foreign key constraints)
      await dbRun('DELETE FROM pressure_readings');
      await dbRun('DELETE FROM temperature_readings');
      await dbRun('DELETE FROM distance_readings');
      
      // Delete device sharing records
      await dbRun('DELETE FROM device_shared_with');
      
      // Finally delete all devices
      const result = await dbRun('DELETE FROM devices');
      
      return {
        success: true,
        deletedDevices: result.changes,
        message: 'All devices and related data cleared successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// Create a database object with promisified methods
const database = {
  get: dbGet,
  run: dbRun,
  all: dbAll,
  // Keep the raw database for any special operations
  raw: db
};

// Export IST utility function for use in other modules
export { getISTTimestamp };

export default database;