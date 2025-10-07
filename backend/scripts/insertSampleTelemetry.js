import db, { dbHelpers } from '../config/database.js';

async function insertSampleTelemetryData() {
  try {
    console.log('🔄 Inserting sample telemetry data...');

    // Get all devices to insert data for
    const devices = await dbHelpers.getAllDevices();
    
    if (devices.length === 0) {
      console.log('❌ No devices found. Please create some devices first.');
      return;
    }

    console.log(`📱 Found ${devices.length} devices. Inserting telemetry data...`);

    for (const device of devices) {
      console.log(`📊 Inserting data for device: ${device.device_name} (${device.device_code})`);
      
      // Insert 50 pressure readings with realistic data
      for (let i = 0; i < 50; i++) {
        const baseTime = new Date();
        baseTime.setMinutes(baseTime.getMinutes() - (50 - i) * 2); // Every 2 minutes
        
        const pressure1 = 80 + Math.random() * 40 + Math.sin(i * 0.1) * 10; // 80-130 kPa with sine wave
        const pressure2 = 70 + Math.random() * 50 + Math.cos(i * 0.15) * 15; // 70-135 kPa with cosine wave
        
        await db.run(
          'INSERT INTO pressure_readings (device_id, pressure1, pressure2, recorded_at) VALUES (?, ?, ?, ?)',
          [device.id, pressure1.toFixed(2), pressure2.toFixed(2), baseTime.toISOString()]
        );
      }

      // Insert 50 temperature readings
      for (let i = 0; i < 50; i++) {
        const baseTime = new Date();
        baseTime.setMinutes(baseTime.getMinutes() - (50 - i) * 2);
        
        const temperature = 20 + Math.random() * 15 + Math.sin(i * 0.08) * 5; // 20-40°C with variation
        
        await db.run(
          'INSERT INTO temperature_readings (device_id, temperature, recorded_at) VALUES (?, ?, ?)',
          [device.id, temperature.toFixed(2), baseTime.toISOString()]
        );
      }

      // Insert 50 distance readings
      for (let i = 0; i < 50; i++) {
        const baseTime = new Date();
        baseTime.setMinutes(baseTime.getMinutes() - (50 - i) * 2);
        
        const distance = 100 + Math.random() * 200 + Math.sin(i * 0.12) * 30; // 70-330 cm with variation
        
        await db.run(
          'INSERT INTO distance_readings (device_id, distance, recorded_at) VALUES (?, ?, ?)',
          [device.id, distance.toFixed(2), baseTime.toISOString()]
        );
      }

      console.log(`✅ Inserted telemetry data for ${device.device_name}`);
    }

    console.log('🎉 Sample telemetry data insertion completed!');
    console.log('📈 You can now test the telemetry visualization in the frontend.');
    
  } catch (error) {
    console.error('❌ Error inserting sample telemetry data:', error);
  } finally {
    // Close database connection
    process.exit(0);
  }
}

// Run the script
insertSampleTelemetryData();