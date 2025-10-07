import { dbHelpers } from '../config/database.js';
import readline from 'readline';

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Utility function to ask questions
const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
};

// Main menu
const showMenu = () => {
  console.log('\n🔧 NighaTech Data Manager');
  console.log('========================');
  console.log('1. Add User');
  console.log('2. Add Device');
  console.log('3. Assign Device to User');
  console.log('4. Delete User');
  console.log('5. View All Users');
  console.log('6. View All Devices');
  console.log('7. View Login Logs');
  console.log('8. View Statistics');
  console.log('9. Insert Sample Data');
  console.log('10. Exit');
  console.log('========================');
};

// Add user function
const addUser = async () => {
  try {
    console.log('\n📝 Adding New User');
    console.log('------------------');
    
    const name = await askQuestion('Enter name: ');
    const phone = await askQuestion('Enter phone number (10 digits): ');
    const email = await askQuestion('Enter email (optional, press Enter to skip): ');
    
    console.log('\nAvailable roles:');
    console.log('1. customer');
    console.log('2. admin');
    console.log('3. superadmin');
    
    const roleChoice = await askQuestion('Select role (1-3): ');
    const roles = ['customer', 'admin', 'superadmin'];
    const role = roles[parseInt(roleChoice) - 1] || 'customer';
    
    const result = await dbHelpers.createUser(name, phone, email || null, role);
    console.log(`✅ User created successfully! ID: ${result.lastID}`);
    
  } catch (error) {
    console.error(`❌ Error creating user: ${error.message}`);
  }
};

// Add device function
const addDevice = async () => {
  try {
    console.log('\n📱 Adding New Device');
    console.log('--------------------');
    
    const deviceCode = await askQuestion('Enter device code (unique): ');
    const deviceName = await askQuestion('Enter device name: ');
    
    const assignChoice = await askQuestion('Assign to user now? (y/n): ');
    let assignedTo = null;
    
    if (assignChoice.toLowerCase() === 'y') {
      const users = await dbHelpers.getAllUsers();
      console.log('\nAvailable users:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.phone}) - ${user.role}`);
      });
      
      const userChoice = await askQuestion('Select user number (or 0 for none): ');
      const userIndex = parseInt(userChoice) - 1;
      
      if (userIndex >= 0 && userIndex < users.length) {
        assignedTo = users[userIndex].id;
      }
    }
    
    const result = await dbHelpers.createDevice(deviceCode, deviceName, assignedTo);
    console.log(`✅ Device created successfully! ID: ${result.lastID}`);
    
  } catch (error) {
    console.error(`❌ Error creating device: ${error.message}`);
  }
};

// Assign device function
const assignDevice = async () => {
  try {
    console.log('\n🔗 Assign Device to User');
    console.log('------------------------');
    
    const devices = await dbHelpers.getAllDevices();
    const unassignedDevices = devices.filter(d => !d.assigned_to);
    
    if (unassignedDevices.length === 0) {
      console.log('❌ No unassigned devices available.');
      return;
    }
    
    console.log('\nUnassigned devices:');
    unassignedDevices.forEach((device, index) => {
      console.log(`${index + 1}. ${device.device_name} (${device.device_code})`);
    });
    
    const deviceChoice = await askQuestion('Select device number: ');
    const deviceIndex = parseInt(deviceChoice) - 1;
    
    if (deviceIndex < 0 || deviceIndex >= unassignedDevices.length) {
      console.log('❌ Invalid device selection.');
      return;
    }
    
    const users = await dbHelpers.getAllUsers();
    console.log('\nAvailable users:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.phone}) - ${user.role}`);
    });
    
    const userChoice = await askQuestion('Select user number: ');
    const userIndex = parseInt(userChoice) - 1;
    
    if (userIndex < 0 || userIndex >= users.length) {
      console.log('❌ Invalid user selection.');
      return;
    }
    
    await dbHelpers.assignDevice(unassignedDevices[deviceIndex].id, users[userIndex].id);
    console.log(`✅ Device assigned successfully!`);
    
  } catch (error) {
    console.error(`❌ Error assigning device: ${error.message}`);
  }
};

// Delete user function
const deleteUser = async () => {
  try {
    console.log('\n🗑️ Delete User');
    console.log('---------------');
    
    const users = await dbHelpers.getAllUsers();
    
    if (users.length === 0) {
      console.log('❌ No users available to delete.');
      return;
    }
    
    console.log('\nAvailable users:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.phone}) - Role: ${user.role} - Created: ${user.created_at}`);
    });
    
    const userChoice = await askQuestion('Select user number to delete (or 0 to cancel): ');
    const userIndex = parseInt(userChoice) - 1;
    
    if (userChoice === '0') {
      console.log('❌ Delete operation cancelled.');
      return;
    }
    
    if (userIndex < 0 || userIndex >= users.length) {
      console.log('❌ Invalid user selection.');
      return;
    }
    
    const selectedUser = users[userIndex];
    
    // Prevent deletion of default admin accounts
    if (selectedUser.phone === '9999999999' || selectedUser.phone === '8888888888') {
      console.log('❌ Cannot delete default admin accounts (superadmin or admin).');
      return;
    }
    
    // Show warning and confirm deletion
    console.log(`\n⚠️  WARNING: You are about to delete user "${selectedUser.name}" (${selectedUser.phone})`);
    console.log('   This action will:');
    console.log('   - Permanently remove the user from the database');
    console.log('   - Unassign any devices currently assigned to this user');
    console.log('   - Remove all OTP sessions for this user');
    console.log('   - Remove all login logs for this user (if admin)');
    
    const confirmation = await askQuestion('\nType "DELETE" to confirm (case-sensitive): ');
    
    if (confirmation !== 'DELETE') {
      console.log('❌ Delete operation cancelled. User not deleted.');
      return;
    }
    
    // Check if user has assigned devices
    const userDevices = await dbHelpers.getDevicesByUser(selectedUser.id);
    if (userDevices.length > 0) {
      console.log(`\n📱 User has ${userDevices.length} assigned device(s). These will be unassigned.`);
      userDevices.forEach(device => {
        console.log(`   - ${device.device_name} (${device.device_code})`);
      });
    }
    
    // Perform deletion
    await dbHelpers.deleteUser(selectedUser.id);
    console.log(`✅ User "${selectedUser.name}" has been successfully deleted.`);
    
    if (userDevices.length > 0) {
      console.log(`✅ ${userDevices.length} device(s) have been unassigned.`);
    }
    
  } catch (error) {
    console.error(`❌ Error deleting user: ${error.message}`);
  }
};

// View functions
const viewUsers = async () => {
  try {
    const users = await dbHelpers.getAllUsers();
    console.log('\n👥 All Users');
    console.log('============');
    users.forEach(user => {
      console.log(`ID: ${user.id} | ${user.name} | ${user.phone} | ${user.email || 'No email'} | Role: ${user.role} | Created: ${user.created_at}`);
    });
  } catch (error) {
    console.error(`❌ Error fetching users: ${error.message}`);
  }
};

const viewDevices = async () => {
  try {
    const devices = await dbHelpers.getAllDevices();
    console.log('\n📱 All Devices');
    console.log('==============');
    devices.forEach(device => {
      const assignedTo = device.assigned_user_name || 'Unassigned';
      console.log(`ID: ${device.id} | ${device.device_name} | Code: ${device.device_code} | Assigned to: ${assignedTo} | Created: ${device.created_at}`);
    });
  } catch (error) {
    console.error(`❌ Error fetching devices: ${error.message}`);
  }
};

const viewLogs = async () => {
  try {
    const logs = await dbHelpers.getLoginLogs(10);
    console.log('\n📊 Recent Login Logs');
    console.log('====================');
    logs.forEach(log => {
      console.log(`${log.admin_name} (${log.admin_phone}) | IP: ${log.ip_address} | Time: ${log.login_time}`);
    });
  } catch (error) {
    console.error(`❌ Error fetching logs: ${error.message}`);
  }
};

const viewStats = async () => {
  try {
    const userStats = await dbHelpers.getUserStats();
    const deviceStats = await dbHelpers.getDeviceStats();
    
    console.log('\n📈 Database Statistics');
    console.log('======================');
    console.log(`👥 Users: ${userStats.total} total`);
    console.log(`   - Customers: ${userStats.customers}`);
    console.log(`   - Admins: ${userStats.admins}`);
    console.log(`   - Super Admins: ${userStats.superadmins}`);
    console.log(`📱 Devices: ${deviceStats.total} total`);
    console.log(`   - Assigned: ${deviceStats.assigned}`);
    console.log(`   - Unassigned: ${deviceStats.unassigned}`);
  } catch (error) {
    console.error(`❌ Error fetching statistics: ${error.message}`);
  }
};

const insertSampleData = async () => {
  try {
    console.log('\n🚀 Inserting sample data...');
    
    // Sample users
    const sampleUsers = [
      { name: 'Test Customer 1', phone: '9000000001', email: 'test1@example.com', role: 'customer' },
      { name: 'Test Customer 2', phone: '9000000002', email: 'test2@example.com', role: 'customer' },
      { name: 'Test Admin', phone: '9000000003', email: 'testadmin@nightech.com', role: 'admin' }
    ];
    
    for (const user of sampleUsers) {
      try {
        await dbHelpers.createUser(user.name, user.phone, user.email, user.role);
        console.log(`✅ Created: ${user.name}`);
      } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
          console.log(`⚠️  ${user.name} already exists, skipping...`);
        }
      }
    }
    
    // Sample devices
    const sampleDevices = [
      { code: 'SAMPLE001', name: 'Sample Temperature Sensor' },
      { code: 'SAMPLE002', name: 'Sample Pressure Monitor' },
      { code: 'SAMPLE003', name: 'Sample Flow Meter' }
    ];
    
    for (const device of sampleDevices) {
      try {
        await dbHelpers.createDevice(device.code, device.name);
        console.log(`✅ Created device: ${device.name}`);
      } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
          console.log(`⚠️  Device ${device.code} already exists, skipping...`);
        }
      }
    }
    
    console.log('✅ Sample data insertion completed!');
  } catch (error) {
    console.error(`❌ Error inserting sample data: ${error.message}`);
  }
};

// Main application loop
const main = async () => {
  console.log('🎉 Welcome to NighaTech Data Manager!');
  
  while (true) {
    showMenu();
    const choice = await askQuestion('\nEnter your choice (1-10): ');
    
    switch (choice) {
      case '1':
        await addUser();
        break;
      case '2':
        await addDevice();
        break;
      case '3':
        await assignDevice();
        break;
      case '4':
        await deleteUser();
        break;
      case '5':
        await viewUsers();
        break;
      case '6':
        await viewDevices();
        break;
      case '7':
        await viewLogs();
        break;
      case '8':
        await viewStats();
        break;
      case '9':
        await insertSampleData();
        break;
      case '10':
        console.log('👋 Goodbye!');
        rl.close();
        process.exit(0);
        break;
      default:
        console.log('❌ Invalid choice. Please try again.');
    }
    
    await askQuestion('\nPress Enter to continue...');
  }
};

// Run the application
main().catch((error) => {
  console.error('💥 Application error:', error);
  rl.close();
  process.exit(1);
});