# 📊 NighaTech Database - Data Insertion Guide

This guide shows you multiple ways to insert data into your NighaTech database tables.

## 🗄️ Database Tables

Your database has 4 main tables:

1. **users** - Stores user information (customers, admins, superadmins)
2. **devices** - Stores device information and assignments
3. **otp_sessions** - Stores OTP verification data
4. **login_logs** - Stores admin login history

## 🚀 Quick Start - Sample Data

### Method 1: Run Sample Data Script
```bash
cd backend
node scripts/insertSampleData.js
```

This script automatically inserts:
- 5 sample customers
- 2 additional admin users
- 10 sample devices
- Device assignments
- Sample login logs

### Method 2: Interactive Data Manager
```bash
cd backend
node scripts/dataManager.js
```

This opens an interactive menu where you can:
- Add users one by one
- Add devices
- Assign devices to users
- Delete users (with safety protections)
- View all data
- Insert sample data

## 📝 Manual Data Insertion

### Using Database Helper Functions

The database provides helper functions in `backend/config/database.js`:

#### Insert Users
```javascript
import { dbHelpers } from './config/database.js';

// Create a customer
const customer = await dbHelpers.createUser(
  'John Doe',              // name
  '9876543210',           // phone (must be unique)
  'john@example.com',     // email (optional)
  'customer'              // role: 'customer', 'admin', or 'superadmin'
);

// Create an admin
const admin = await dbHelpers.createUser(
  'Admin User',
  '9876543211',
  'admin@nightech.com',
  'admin'
);
```

#### Insert Devices
```javascript
// Create a device (unassigned)
const device = await dbHelpers.createDevice(
  'TEMP001',                    // device_code (must be unique)
  'Temperature Sensor Room 1',  // device_name
  null                          // assigned_to (null = unassigned)
);

// Create a device and assign to user
const assignedDevice = await dbHelpers.createDevice(
  'PRESS001',
  'Pressure Monitor',
  userId                        // assign to specific user ID
);
```

#### Assign Devices
```javascript
// Assign existing device to user
await dbHelpers.assignDevice(deviceId, userId);

// Unassign device
await dbHelpers.unassignDevice(deviceId);
```

#### Create Login Logs
```javascript
// Log admin login
await dbHelpers.createLoginLog(
  adminId,                      // admin user ID
  '192.168.1.100',             // IP address
  'Mozilla/5.0...'             // user agent string
);
```

#### Delete Users
```javascript
// Delete a user by ID
await dbHelpers.deleteUser(userId);

// Note: This will automatically:
// - Unassign any devices assigned to the user
// - Remove all OTP sessions for the user
// - Remove all login logs for the user (if admin)
```

## 🔧 API Endpoints for Data Insertion

You can also insert data via API calls to your running backend server:

### Create User (POST /api/auth/register)
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New User",
    "phone": "9876543212",
    "email": "newuser@example.com",
    "role": "customer"
  }'
```

### Add Device (Admin only)
```bash
curl -X POST http://localhost:3001/api/devices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "deviceCode": "DEV011",
    "deviceName": "New Sensor",
    "assignedTo": null
  }'
```

## 📊 View Data

### Using Helper Functions
```javascript
// Get all users
const users = await dbHelpers.getAllUsers();

// Get all devices
const devices = await dbHelpers.getAllDevices();

// Get user statistics
const userStats = await dbHelpers.getUserStats();

// Get device statistics
const deviceStats = await dbHelpers.getDeviceStats();

// Get recent login logs
const logs = await dbHelpers.getLoginLogs(10);
```

### Using API Endpoints
```bash
# Get all users (admin only)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/api/users

# Get all devices
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/api/devices
```

## 🗑️ Delete User Functionality

The interactive data manager includes a safe user deletion feature:

### Safety Features
- **Protected Accounts**: Cannot delete default admin accounts (superadmin: 9999999999, admin: 8888888888)
- **Confirmation Required**: Must type "DELETE" exactly to confirm deletion
- **Impact Warning**: Shows what will be affected before deletion
- **Device Handling**: Automatically unassigns devices from deleted users

### Interactive Delete Process
1. Select "4. Delete User" from the main menu
2. Choose user from the numbered list
3. Review the warning message showing:
   - User details to be deleted
   - Impact on assigned devices
   - Impact on OTP sessions and login logs
4. Type "DELETE" to confirm (case-sensitive)
5. User is safely removed with all related data cleaned up

### Example Delete Session
```
🗑️ Delete User
---------------

Available users:
1. John Doe (9876543210) - Role: customer - Created: 2025-10-02 15:11:03
2. Jane Smith (9876543211) - Role: customer - Created: 2025-10-02 15:11:03

Select user number to delete (or 0 to cancel): 1

⚠️  WARNING: You are about to delete user "John Doe" (9876543210)
   This action will:
   - Permanently remove the user from the database
   - Unassign any devices currently assigned to this user
   - Remove all OTP sessions for this user
   - Remove all login logs for this user (if admin)

📱 User has 2 assigned device(s). These will be unassigned.
   - Temperature Sensor A1 (DEV001)
   - Pressure Monitor B2 (DEV002)

Type "DELETE" to confirm (case-sensitive): DELETE

✅ User "John Doe" has been successfully deleted.
✅ 2 device(s) have been unassigned.
```

## 🎯 Batch Data Insertion

### Using the Manual Insert Script
```javascript
import { batchInsertUsers } from './scripts/manualInsert.js';

const users = [
  { name: 'User 1', phone: '9000000001', email: 'user1@example.com', role: 'customer' },
  { name: 'User 2', phone: '9000000002', email: 'user2@example.com', role: 'customer' },
  { name: 'Admin 1', phone: '9000000003', email: 'admin1@nightech.com', role: 'admin' }
];

const results = await batchInsertUsers(users);
console.log(results);
```

## ⚠️ Important Notes

### Data Constraints
- **Phone numbers** must be unique and 10 digits
- **Device codes** must be unique
- **Email addresses** must be unique (if provided)
- **Roles** must be: 'customer', 'admin', or 'superadmin'

### Default Users
The system automatically creates:
- Super Admin: phone `9999999999`, email `superadmin@nightech.com`
- Admin User: phone `8888888888`, email `admin@nightech.com`

### Role Permissions
- **Superadmin**: Can manage all users and devices
- **Admin**: Can manage customers and devices
- **Customer**: Can view assigned devices only

## 🔍 Troubleshooting

### Common Errors
1. **UNIQUE constraint failed**: Phone number or device code already exists
2. **Invalid role**: Role must be 'customer', 'admin', or 'superadmin'
3. **Invalid phone**: Phone must be 10 digits starting with 6-9

### Check Data
```bash
# Run the interactive data manager to view current data
cd backend
node scripts/dataManager.js
# Then select option 4, 5, 6, or 7 to view data
```

## 📁 File Locations

- **Database helpers**: `backend/config/database.js`
- **Sample data script**: `backend/scripts/insertSampleData.js`
- **Manual insert script**: `backend/scripts/manualInsert.js`
- **Interactive manager**: `backend/scripts/dataManager.js`
- **Database file**: `backend/database.sqlite`

## 🎉 Quick Test

To verify everything is working:

1. **Insert sample data**:
   ```bash
   cd backend
   node scripts/insertSampleData.js
   ```

2. **View the data**:
   ```bash
   node scripts/dataManager.js
   # Select option 7 for statistics
   ```

3. **Test the web interface**:
   - Login as superadmin: `9999999999`
   - Go to User Management to see all users
   - Go to Devices to see all devices

Your database is now populated and ready for testing! 🚀