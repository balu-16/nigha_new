import db from './config/database.js';
import { promisify } from 'util';

const dbAll = promisify(db.all.bind(db));
const dbGet = promisify(db.get.bind(db));

(async () => {
  try {
    // Check users table with phone numbers
    console.log('=== users table (customers with phone numbers) ===');
    const users = await dbAll('SELECT id, name, phone, role FROM users WHERE role = "customer"');
    console.log('Rows:', users.length);
    users.forEach(row => {
      console.log(`ID: ${row.id}, Name: ${row.name}, Phone: ${row.phone}, Role: ${row.role}`);
    });
    
    // Test the exact query used in the share endpoint
    console.log('\n=== Testing phone lookup for 9876543213 ===');
    const testUser = await dbGet('SELECT * FROM users WHERE phone = ? AND role = ?', ['9876543213', 'customer']);
    console.log('Result:', testUser);
    
    db.close();
  } catch (error) {
    console.error('Error:', error);
    db.close();
  }
})();