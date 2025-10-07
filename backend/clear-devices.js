import { dbHelpers } from './config/database.js';

async function clearDevices() {
  try {
    console.log('Clearing all devices from the database...');
    
    const result = await dbHelpers.clearAllDevices();
    
    if (result.success) {
      console.log('✅ Success:', result.message);
      console.log('📊 Devices deleted:', result.deletedDevices);
      
      // Verify deletion
      const remainingDevices = await dbHelpers.getAllDevices();
      console.log('📋 Remaining devices:', remainingDevices.length);
      
      console.log('🎉 Database cleanup completed successfully!');
    } else {
      console.error('❌ Error:', result.error);
      process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  }
}

clearDevices();