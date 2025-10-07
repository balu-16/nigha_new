import express from 'express';
import { authenticateToken, adminOnly, superAdminOnly } from '../middleware/auth.js';
import { dbHelpers } from '../config/database.js';

const router = express.Router();

// GET /admin/logs - Get admin login logs (superadmin only)
router.get('/logs', authenticateToken, superAdminOnly, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const maxLimit = req.user.role === 'superadmin' ? 1000 : 100;
    const finalLimit = Math.min(limit, maxLimit);

    const logs = await dbHelpers.getLoginLogs(finalLimit);

    res.json({
      success: true,
      logs: logs || [],
      total: logs ? logs.length : 0,
      limit: finalLimit
    });

  } catch (error) {
    console.error('Get admin logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin logs'
    });
  }
});

// GET /admin/users - Get all users (admin/superadmin only)
router.get('/users', authenticateToken, adminOnly, async (req, res) => {
  try {
    const users = await dbHelpers.getAllUsers();

    // Remove sensitive information and filter based on role
    const filteredUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      created_at: user.created_at
    }));

    // Regular admin can only see customers, superadmin can see all
    const finalUsers = req.user.role === 'superadmin' 
      ? filteredUsers 
      : filteredUsers.filter(user => user.role === 'customer');

    res.json({
      success: true,
      data: finalUsers,
      total: finalUsers.length
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users'
    });
  }
});

// POST /admin/users - Create new user (admin/superadmin only)
router.post('/users', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { name, phone, email, role } = req.body;

    // Validate required fields
    if (!name || !phone || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone, and role are required'
      });
    }

    // Validate role permissions
    if (req.user.role === 'admin' && role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Admin can only create customer accounts'
      });
    }

    if (req.user.role === 'superadmin' && !['customer', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Allowed: customer, admin'
      });
    }

    // Validate phone number format
    const formattedPhone = phone.replace(/[\s\-\+]/g, '');
    const indianMobileRegex = /^[6-9]\d{9}$/;
    if (!indianMobileRegex.test(formattedPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format'
      });
    }

    // Check if user already exists
    const existingUser = await dbHelpers.getUserByPhone(formattedPhone);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this phone number already exists'
      });
    }

    // Create new user
    const result = await dbHelpers.createUser(name, formattedPhone, email || null, role);
    
    const newUser = {
      id: result.lastInsertRowid,
      name,
      phone: formattedPhone,
      email: email || null,
      role,
      created_at: new Date().toISOString()
    };

    console.log(`✅ New ${role} user created by ${req.user.name}: ${name} (${formattedPhone})`);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        phone: newUser.phone,
        email: newUser.email,
        role: newUser.role,
        created_at: newUser.created_at
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating user'
    });
  }
});

// PUT /admin/users/:userId/role - Update user role (superadmin only)
router.put('/users/:userId/role', authenticateToken, superAdminOnly, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Validate role
    const validRoles = ['customer', 'admin', 'superadmin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be one of: customer, admin, superadmin'
      });
    }

    // Check if user exists
    const user = await dbHelpers.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent superadmin from changing their own role
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own role'
      });
    }

    // Update user role
    const updateUserRole = dbHelpers.db.prepare(`
      UPDATE users SET role = ? WHERE id = ?
    `);
    
    updateUserRole.run(role, userId);

    console.log(`✅ User role updated by ${req.user.name}: ${user.name} (${user.phone}) -> ${role}`);

    res.json({
      success: true,
      message: 'User role updated successfully'
    });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role'
    });
  }
});

// DELETE /admin/users/:userId - Delete user (admin/superadmin with role restrictions)
router.delete('/users/:userId', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await dbHelpers.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent user from deleting themselves
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Role-based deletion restrictions
    if (req.user.role === 'admin') {
      // Admins can only delete customers
      if (user.role !== 'customer') {
        return res.status(403).json({
          success: false,
          message: 'Admins can only delete customer accounts'
        });
      }
    } else if (req.user.role === 'superadmin') {
      // Superadmins can delete admins and customers, but not other superadmins
      if (user.role === 'superadmin') {
        return res.status(403).json({
          success: false,
          message: 'Cannot delete other superadmin accounts'
        });
      }
    }

    // Delete user (this will cascade delete related records due to foreign keys)
    const result = await dbHelpers.deleteUser(userId);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log(`🗑️ User deleted by ${req.user.name}: ${user.name} (${user.phone})`);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

// GET /admin/stats - Get dashboard statistics (admin/superadmin only)
router.get('/stats', authenticateToken, adminOnly, (req, res) => {
  try {
    // Get user counts by role
    const userStats = dbHelpers.db.prepare(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role
    `).all();

    // Get device stats
    const deviceStats = dbHelpers.db.prepare(`
      SELECT 
        COUNT(*) as total_devices,
        COUNT(assigned_to) as assigned_devices,
        COUNT(*) - COUNT(assigned_to) as unassigned_devices
      FROM devices
    `).get();

    // Get recent login logs count
    const recentLogins = dbHelpers.db.prepare(`
      SELECT COUNT(*) as count 
      FROM login_logs 
      WHERE login_time > datetime('now', '-7 days')
    `).get();

    // Get OTP sessions stats
    const otpStats = dbHelpers.db.prepare(`
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN is_verified = 1 THEN 1 END) as verified_sessions,
        COUNT(CASE WHEN expires_at > datetime('now') AND is_verified = 0 THEN 1 END) as active_sessions
      FROM otp_sessions 
      WHERE created_at > datetime('now', '-24 hours')
    `).get();

    const stats = {
      users: userStats.reduce((acc, stat) => {
        acc[stat.role] = stat.count;
        return acc;
      }, {}),
      devices: deviceStats,
      recent_logins: recentLogins.count,
      otp_sessions_24h: otpStats
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve statistics'
    });
  }
});

export default router;