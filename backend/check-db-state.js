import { dbHelpers } from './config/database.js';

async function checkDatabaseState() {
  try {
    console.log('🔍 Checking database state...\n');
    
    // Get all users
    const users = await dbHelpers.getAllUsers();
    console.log('👥 Users in database:');
    users.forEach(user => {
      console.log(`  - ID: ${user.id}, Name: ${user.name}, Phone: ${user.phone}, Role: ${user.role}`);
    });
    
    console.log('\n📱 All devices in database:');
    const allDevices = await dbHelpers.getAllDevices();
    allDevices.forEach(device => {
      console.log(`  - ID: ${device.id}, Code: ${device.device_code}, Name: ${device.device_name}, Assigned to: ${device.assigned_to} (${device.assigned_user_name || 'Unassigned'})`);
    });
    
    // Check devices for each customer
    console.log('\n🔗 Devices by customer:');
    const customers = users.filter(user => user.role === 'customer');
    for (const customer of customers) {
      const customerDevices = await dbHelpers.getCustomerDevices(customer.id);
      console.log(`  - ${customer.name} (ID: ${customer.id}): ${customerDevices.length} devices`);
      customerDevices.forEach(device => {
        console.log(`    * ${device.device_name} (${device.device_code})`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('💥 Error:', error);
    process.exit(1);
  }
}

checkDatabaseState();