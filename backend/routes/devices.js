import express from 'express';
import { authenticateToken, adminOnly, customerOrHigher } from '../middleware/auth.js';
import db, { dbHelpers } from '../config/database.js';
import QRCode from 'qrcode';

const router = express.Router();

// POST /devices - Create a new device (admin/superadmin only)
router.post('/', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { device_code, device_name, assigned_to } = req.body;

    if (!device_code || !device_name) {
      return res.status(400).json({
        success: false,
        message: 'Device code and device name are required'
      });
    }

    // Check if device code already exists
    const existingDevice = await dbHelpers.getDeviceByCode(device_code);
    if (existingDevice) {
      return res.status(409).json({
        success: false,
        message: 'Device with this code already exists'
      });
    }

    // Validate assigned_to user if provided
    if (assigned_to) {
      const assignedUser = await dbHelpers.getUserById(assigned_to);
      if (!assignedUser) {
        return res.status(400).json({
          success: false,
          message: 'Assigned user does not exist'
        });
      }
    }

    // Create new device
    const result = await dbHelpers.createDevice(device_code, device_name, assigned_to || null);
    
    const newDevice = {
      id: result.lastInsertRowid,
      device_code,
      device_name,
      assigned_to: assigned_to || null,
      created_at: new Date().toISOString()
    };

    console.log(`✅ New device added: ${device_name} (${device_code}) by ${req.user.name}`);

    res.status(201).json({
      success: true,
      message: 'Device added successfully',
      device: newDevice
    });

  } catch (error) {
    console.error('Add device error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while adding device'
    });
  }
});

// POST /devices/generate-bulk - Generate multiple devices with QR codes (admin/superadmin only)
router.post('/generate-bulk', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { count } = req.body;

    if (!count || count <= 0 || count > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Count must be between 1 and 1000'
      });
    }

    const generatedDevices = [];
    const errors = [];

    for (let i = 0; i < count; i++) {
      try {
        // Generate unique 16-digit device code
        let deviceCode;
        let isUnique = false;
        let attempts = 0;
        
        while (!isUnique && attempts < 10) {
          deviceCode = Math.random().toString().slice(2, 18).padStart(16, '0');
          const existingDevice = await dbHelpers.getDeviceByCode(deviceCode);
          if (!existingDevice) {
            isUnique = true;
          }
          attempts++;
        }

        if (!isUnique) {
          errors.push(`Failed to generate unique code for device ${i + 1}`);
          continue;
        }

        // Generate QR code as buffer
        const qrCodeBuffer = await QRCode.toBuffer(deviceCode, {
          type: 'png',
          width: 200,
          margin: 2
        });

        // Create device with QR code
        const result = await dbHelpers.createDeviceWithQR(deviceCode, `Device ${deviceCode}`, null, qrCodeBuffer);
        
        generatedDevices.push({
          id: result.lastInsertRowid,
          device_code: deviceCode,
          device_name: `Device ${deviceCode}`,
          assigned_to: null,
          has_qr_code: true,
          created_at: new Date().toISOString()
        });

      } catch (error) {
        console.error(`Error generating device ${i + 1}:`, error);
        errors.push(`Failed to generate device ${i + 1}: ${error.message}`);
      }
    }

    console.log(`📱 Generated ${generatedDevices.length} devices by ${req.user.name}`);

    res.status(201).json({
      success: true,
      message: `Successfully generated ${generatedDevices.length} devices`,
      devices: generatedDevices,
      errors: errors.length > 0 ? errors : undefined,
      total_generated: generatedDevices.length,
      total_requested: count
    });

  } catch (error) {
    console.error('Bulk device generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while generating devices'
    });
  }
});

// GET /devices/list - Get devices list
router.get('/list', authenticateToken, customerOrHigher, async (req, res) => {
  try {
    let devices;

    // If user is customer, only show their assigned devices
    if (req.user.role === 'customer') {
      devices = await dbHelpers.getDevicesByUser(req.user.id);
    } else {
      // Admin/SuperAdmin can see all devices
      devices = await dbHelpers.getAllDevices();
    }

    res.json({
      success: true,
      data: devices || [],
      total: devices ? devices.length : 0
    });

  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve devices'
    });
  }
});

// GET /devices/my - Get current user's assigned devices
router.get('/my', authenticateToken, customerOrHigher, async (req, res) => {
  try {
    const devices = await dbHelpers.getDevicesByUser(req.user.id);

    res.json({
      success: true,
      devices: devices || [],
      total: devices ? devices.length : 0
    });

  } catch (error) {
    console.error('Get my devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve your devices'
    });
  }
});

// GET /devices/:deviceCode - Get device by code
router.get('/:deviceCode', authenticateToken, customerOrHigher, async (req, res) => {
  try {
    const { deviceCode } = req.params;
    const device = await dbHelpers.getDeviceByCode(deviceCode);

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // If user is customer, check if they have access (owns it or it's shared with them)
    if (req.user.role === 'customer') {
      const hasAccess = await db.get(`
        SELECT d.* FROM devices d
        LEFT JOIN device_shared_with s ON d.id = s.device_id
        WHERE d.id = ? AND (d.assigned_to = ? OR s.shared_with_user_id = ?)`,
        [device.id, req.user.id, req.user.id]
      );

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Device not assigned to you or shared with you.'
        });
      }
    }

    res.json({
      success: true,
      device
    });

  } catch (error) {
    console.error('Get device error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve device'
    });
  }
});

// PUT /devices/:deviceCode/assign - Assign device to user (admin/superadmin only)
router.put('/:deviceCode/assign', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { deviceCode } = req.params;
    const { assigned_to } = req.body;

    // Check if device exists
    const device = await dbHelpers.getDeviceByCode(deviceCode);
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Validate assigned_to user if provided
    if (assigned_to) {
      const assignedUser = await dbHelpers.getUserById(assigned_to);
      if (!assignedUser) {
        return res.status(400).json({
          success: false,
          message: 'Assigned user does not exist'
        });
      }
    }

    // Update device assignment
    const updateDevice = db.prepare(`
      UPDATE devices SET assigned_to = ? WHERE device_code = ?
    `);
    
    updateDevice.run(assigned_to || null, deviceCode);

    console.log(`✅ Device ${deviceCode} assignment updated by ${req.user.name}`);

    res.json({
      success: true,
      message: 'Device assignment updated successfully'
    });

  } catch (error) {
    console.error('Assign device error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign device'
    });
  }
});

// DELETE /devices/:deviceCode - Delete device (superadmin only)
router.delete('/:deviceCode', authenticateToken, async (req, res) => {
  try {
    // Only admin and superadmin can delete devices
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or SuperAdmin privileges required.'
      });
    }

    const { deviceCode } = req.params;

    // Check if device exists
    const device = await dbHelpers.getDeviceByCode(deviceCode);
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Delete device
    const deleteDevice = db.prepare(`
      DELETE FROM devices WHERE device_code = ?
    `);
    
    const result = deleteDevice.run(deviceCode);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    console.log(`🗑️ Device ${deviceCode} deleted by ${req.user.name}`);

    res.json({
      success: true,
      message: 'Device deleted successfully'
    });

  } catch (error) {
    console.error('Delete device error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete device'
    });
  }
});

// PUT /devices/:deviceCode/m2m - Update M2M number for a device (admin/superadmin only)
router.put('/:deviceCode/m2m', authenticateToken, async (req, res) => {
  try {
    // Only admin and superadmin can update M2M numbers
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or SuperAdmin privileges required.'
      });
    }

    const { deviceCode } = req.params;
    const { m2m_number } = req.body;

    if (!m2m_number) {
      return res.status(400).json({
        success: false,
        message: 'M2M number is required'
      });
    }

    // Check if device exists
    const device = await dbHelpers.getDeviceByCode(deviceCode);
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Update M2M number
    await dbHelpers.updateDeviceM2MNumber(device.id, m2m_number);

    console.log(`📱 M2M number updated for device ${deviceCode} by ${req.user.name}`);

    res.json({
      success: true,
      message: 'M2M number updated successfully',
      data: {
        device_code: deviceCode,
        m2m_number: m2m_number
      }
    });

  } catch (error) {
    console.error('Update M2M number error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update M2M number'
    });
  }
});

// GET /devices/:deviceCode/qr - Get QR code image for a device
router.get('/:deviceCode/qr', authenticateToken, customerOrHigher, async (req, res) => {
  try {
    const { deviceCode } = req.params;

    const device = await dbHelpers.getDeviceByCode(deviceCode);
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    if (!device.qr_code) {
      return res.status(404).json({
        success: false,
        message: 'QR code not available for this device'
      });
    }

    // Set appropriate headers for image response
    res.set({
      'Content-Type': 'image/png',
      'Content-Length': device.qr_code.length,
      'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
    });

    res.send(device.qr_code);

  } catch (error) {
    console.error('Get QR code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve QR code'
    });
  }
});

// Customer Device Management Endpoints

// POST /devices/assign - Assign device to customer (QR/manual)
router.post('/assign', authenticateToken, customerOrHigher, async (req, res) => {
  try {
    const { device_code, device_name } = req.body;
    const customerId = req.user.id;

    if (!device_code) {
      return res.status(400).json({
        success: false,
        message: 'Device code is required'
      });
    }

    // Validate device code format (16 digits)
    if (!/^\d{16}$/.test(device_code)) {
      return res.status(400).json({
        success: false,
        message: 'Device code must be exactly 16 digits'
      });
    }

    await dbHelpers.assignDeviceToCustomer(device_code, customerId, device_name);

    console.log(`📱 Device ${device_code} assigned to customer ${req.user.name}`);

    res.json({
      success: true,
      message: 'Device assigned successfully'
    });

  } catch (error) {
    console.error('Assign device error:', error);
    
    if (error.message === 'Device not found') {
      return res.status(404).json({
        success: false,
        message: 'Device not found. Please check the device code.'
      });
    }
    
    if (error.message === 'Device already allocated') {
      return res.status(409).json({
        success: false,
        message: 'Device is already assigned to another customer'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to assign device'
    });
  }
});

// GET /devices/owned/:userId - Get devices allocated to user
router.get('/owned/:userId', authenticateToken, customerOrHigher, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Customers can only view their own devices
    if (req.user.role === 'customer' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const devices = await dbHelpers.getCustomerDevices(userId);

    res.json({
      success: true,
      data: devices
    });

  } catch (error) {
    console.error('Get owned devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve devices'
    });
  }
});

// POST /devices/share - Share device with another user
router.post('/share', authenticateToken, customerOrHigher, async (req, res) => {
  try {
    const { deviceId, recipientPhone } = req.body;
    console.log(`🔍 Share device request: deviceId=${deviceId}, recipientPhone=${recipientPhone}, userId=${req.user.id}`);

    if (!deviceId || !recipientPhone) {
      return res.status(400).json({
        success: false,
        message: 'Device ID and recipient phone number are required'
      });
    }

    // Verify the device belongs to the current user
    const deviceById = await db.get('SELECT * FROM devices WHERE id = ? AND assigned_to = ?', [deviceId, req.user.id]);
    console.log(`🔍 Device lookup result:`, deviceById);
    
    if (!deviceById) {
      return res.status(403).json({
        success: false,
        message: 'You can only share devices that belong to you'
      });
    }

    // Find the target user by phone number
    const targetUser = await db.get('SELECT * FROM users WHERE phone = ? AND role = ?', [recipientPhone, 'customer']);
    console.log(`🔍 Target user lookup result:`, targetUser);
    if (!targetUser) {
      return res.status(400).json({
        success: false,
        message: 'No customer found with this phone number'
      });
    }

    // Check if device is already shared with this user
    const existingShare = await db.get('SELECT * FROM device_shared_with WHERE device_id = ? AND shared_with_user_id = ?', [deviceId, targetUser.id]);
    console.log(`🔍 Existing share check: deviceId=${deviceId}, targetUserId=${targetUser.id}, result:`, existingShare);
    if (existingShare) {
      return res.status(409).json({
        success: false,
        message: 'Device is already shared with this user'
      });
    }

    // Share the device
    await db.run('INSERT INTO device_shared_with (device_id, shared_with_user_id, shared_at) VALUES (?, ?, ?)', 
      [deviceId, targetUser.id, new Date().toISOString()]);

    console.log(`🔗 Device ${deviceById.device_code} shared by ${req.user.name} with ${targetUser.name} (${recipientPhone})`);

    res.json({
      success: true,
      message: `Device shared successfully with ${targetUser.name}`
    });

  } catch (error) {
    console.error('Share device error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to share device'
    });
  }
});

// DELETE /devices/:deviceCode/revoke/:userId - Revoke device access
router.delete('/:deviceCode/revoke/:userId', authenticateToken, customerOrHigher, async (req, res) => {
  try {
    const { deviceCode, userId } = req.params;

    // Get device by code
    const device = await dbHelpers.getDeviceByCode(deviceCode);
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Check if user owns the device or is admin/superadmin
    if (req.user.role === 'customer' && device.assigned_to !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only revoke access for your own devices.'
      });
    }

    // Get target user by ID
    const targetUser = await dbHelpers.getUserById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if device is currently shared with this user
    const existingShare = await db.get('SELECT * FROM device_shared_with WHERE device_id = ? AND shared_with_user_id = ?', [device.id, targetUser.id]);
    if (!existingShare) {
      return res.status(404).json({
        success: false,
        message: 'Device is not shared with this user'
      });
    }

    // Revoke access by deleting the sharing relationship
    await db.run('DELETE FROM device_shared_with WHERE device_id = ? AND shared_with_user_id = ?', [device.id, targetUser.id]);

    console.log(`🔒 Device ${deviceCode} access revoked from ${targetUser.name} by ${req.user.name}`);

    res.json({
      success: true,
      message: `Device access revoked from ${targetUser.name}`
    });

  } catch (error) {
    console.error('Revoke device access error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to revoke device access'
    });
  }
});

// GET /devices/sent/:userId - Devices shared by user
router.get('/sent/:userId', authenticateToken, customerOrHigher, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Customers can only view their own shared devices
    if (req.user.role === 'customer' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const sentDevices = await dbHelpers.getSentDevices(userId);

    res.json({
      success: true,
      data: sentDevices
    });

  } catch (error) {
    console.error('Get sent devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve sent devices'
    });
  }
});

// GET /devices/received/:userId - Devices shared to user
router.get('/received/:userId', authenticateToken, customerOrHigher, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Customers can only view their own received devices
    if (req.user.role === 'customer' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const receivedDevices = await dbHelpers.getReceivedDevices(userId);

    res.json({
      success: true,
      data: receivedDevices
    });

  } catch (error) {
    console.error('Get received devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve received devices'
    });
  }
});

// GET /devices/customers - Get list of customers for sharing
router.get('/customers', authenticateToken, customerOrHigher, async (req, res) => {
  try {
    const customers = await dbHelpers.getCustomerUsers();
    
    // Remove current user from the list
    const filteredCustomers = customers.filter(customer => customer.id !== req.user.id);

    res.json({
      success: true,
      data: filteredCustomers
    });

  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve customers'
    });
  }
});

// Telemetry Endpoints

// GET /devices/:id/pressure - Get pressure readings for a device
router.get('/:id/pressure', authenticateToken, customerOrHigher, async (req, res) => {
  try {
    const { id } = req.params;
    const deviceId = parseInt(id);

    if (isNaN(deviceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid device ID'
      });
    }

    // Check if device exists
    const device = await dbHelpers.getDeviceById(deviceId);
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Check if user has access to this device (owns it or it's shared with them)
    if (req.user.role === 'customer') {
      const hasAccess = await db.get(
        `SELECT 1 FROM devices d 
         LEFT JOIN device_shared_with s ON d.id = s.device_id 
         WHERE d.id = ? AND (d.assigned_to = ? OR s.shared_with_user_id = ?)`,
        [deviceId, req.user.id, req.user.id]
      );
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this device'
        });
      }
    }

    const readings = await dbHelpers.getPressureReadings(deviceId);

    res.json({
      success: true,
      data: readings
    });

  } catch (error) {
    console.error('Get pressure readings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pressure readings'
    });
  }
});

// GET /devices/:id/temperature - Get temperature readings for a device
router.get('/:id/temperature', authenticateToken, customerOrHigher, async (req, res) => {
  try {
    const { id } = req.params;
    const deviceId = parseInt(id);

    if (isNaN(deviceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid device ID'
      });
    }

    // Check if device exists
    const device = await dbHelpers.getDeviceById(deviceId);
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Check if user has access to this device
    if (req.user.role === 'customer') {
      const hasAccess = await db.get(
        `SELECT 1 FROM devices d 
         LEFT JOIN device_shared_with s ON d.id = s.device_id 
         WHERE d.id = ? AND (d.assigned_to = ? OR s.shared_with_user_id = ?)`,
        [deviceId, req.user.id, req.user.id]
      );
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this device'
        });
      }
    }

    const readings = await dbHelpers.getTemperatureReadings(deviceId);

    res.json({
      success: true,
      data: readings
    });

  } catch (error) {
    console.error('Get temperature readings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve temperature readings'
    });
  }
});

// GET /devices/:id/distance - Get distance readings for a device
router.get('/:id/distance', authenticateToken, customerOrHigher, async (req, res) => {
  try {
    const { id } = req.params;
    const deviceId = parseInt(id);

    if (isNaN(deviceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid device ID'
      });
    }

    // Check if device exists
    const device = await dbHelpers.getDeviceById(deviceId);
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Check if user has access to this device
    if (req.user.role === 'customer') {
      const hasAccess = await db.get(
        `SELECT 1 FROM devices d 
         LEFT JOIN device_shared_with s ON d.id = s.device_id 
         WHERE d.id = ? AND (d.assigned_to = ? OR s.shared_with_user_id = ?)`,
        [deviceId, req.user.id, req.user.id]
      );
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this device'
        });
      }
    }

    const readings = await dbHelpers.getDistanceReadings(deviceId);

    res.json({
      success: true,
      data: readings
    });

  } catch (error) {
    console.error('Get distance readings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve distance readings'
    });
  }
});

// GET /devices/:id/latest-readings - Get latest readings for all telemetry types
router.get('/:id/latest-readings', authenticateToken, customerOrHigher, async (req, res) => {
  try {
    const { id } = req.params;
    const deviceId = parseInt(id);

    if (isNaN(deviceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid device ID'
      });
    }

    // Check if device exists
    const device = await dbHelpers.getDeviceById(deviceId);
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Check if user has access to this device
    if (req.user.role === 'customer') {
      const hasAccess = await db.get(
        `SELECT 1 FROM devices d 
         LEFT JOIN device_shared_with s ON d.id = s.device_id 
         WHERE d.id = ? AND (d.assigned_to = ? OR s.shared_with_user_id = ?)`,
        [deviceId, req.user.id, req.user.id]
      );
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this device'
        });
      }
    }

    // Fetch readings for all sensors (all devices have all sensors)
    const readings = {};
    readings.pressure = await dbHelpers.getLatestPressureReading(deviceId);
    readings.temperature = await dbHelpers.getLatestTemperatureReading(deviceId);
    readings.distance = await dbHelpers.getLatestDistanceReading(deviceId);

    res.json({
      success: true,
      data: readings
    });

  } catch (error) {
    console.error('Get latest readings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve latest readings'
    });
  }
});

export default router;