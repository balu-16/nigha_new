import express from 'express';
import { SQLiteOtpService } from '../services/otpService.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import { dbHelpers } from '../config/database.js';

const router = express.Router();

// POST /auth/signup - Customer signup only (admin/superadmin are pre-created)
router.post('/signup', async (req, res) => {
  try {
    const { name, phone, email } = req.body;

    // Validate required fields
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone number are required'
      });
    }

    // Format and validate phone number
    const formattedPhone = SQLiteOtpService.formatPhoneNumber(phone);
    if (!SQLiteOtpService.validatePhoneNumber(formattedPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format. Must be a valid 10-digit Indian mobile number starting with 6-9'
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

    // Create new customer user
    const result = await dbHelpers.createUser(name, formattedPhone, email || null, 'customer');
    
    const newUser = {
      id: result.lastID,
      name,
      phone: formattedPhone,
      email: email || null,
      role: 'customer'
    };

    console.log(`✅ New customer registered: ${name} (${formattedPhone})`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        phone: newUser.phone,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during signup'
    });
  }
});

// POST /auth/send-otp - Send OTP for login
router.post('/send-otp', async (req, res) => {
  try {
    const { phone, role } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Format phone number
    const formattedPhone = SQLiteOtpService.formatPhoneNumber(phone);

    // Send OTP with role-based validation
    const otpResult = await SQLiteOtpService.sendOTP(formattedPhone, null, role);

    res.json({
      success: true,
      message: 'OTP sent successfully',
      phoneNumber: otpResult.phoneNumber,
      userType: otpResult.userType,
      user: {
        id: otpResult.user.id,
        name: otpResult.user.name,
        role: otpResult.user.role
      },
      // Only include OTP in development mode for testing
      ...(process.env.NODE_ENV === 'development' && { otp: otpResult.otp })
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to send OTP'
    });
  }
});

// POST /auth/verify-otp - Verify OTP and login
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and OTP are required'
      });
    }

    // Format phone number
    const formattedPhone = SQLiteOtpService.formatPhoneNumber(phone);

    // Verify OTP
    const verificationResult = await SQLiteOtpService.verifyOTP(formattedPhone, otp);

    if (!verificationResult.isValid) {
      return res.status(400).json({
        success: false,
        message: verificationResult.message
      });
    }

    // Get user details
    const user = await dbHelpers.getUserByPhone(formattedPhone);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Log admin/superadmin login
    if (['admin', 'superadmin'].includes(user.role)) {
      try {
        const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
        const userAgent = req.get('User-Agent') || 'unknown';
        await dbHelpers.createLoginLog(user.id, clientIP, userAgent);
        console.log(`📝 Admin login logged: ${user.name} (${user.phone}) from ${clientIP}`);
      } catch (logError) {
        console.error('Error logging admin login:', logError);
        // Don't fail the login if logging fails
      }
    }

    // Generate JWT token
    const token = generateToken(user);

    console.log(`✅ User logged in successfully: ${user.name} (${user.phone}) - Role: ${user.role}`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role
        }
      }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during OTP verification'
    });
  }
});

// GET /auth/profile - Get current user profile
router.get('/profile', authenticateToken, (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        phone: req.user.phone,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile'
    });
  }
});

// POST /auth/logout - Logout (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
  try {
    console.log(`📤 User logged out: ${req.user.name} (${req.user.phone})`);
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

// POST /auth/cleanup-otps - Cleanup expired OTPs (admin only)
router.post('/cleanup-otps', authenticateToken, async (req, res) => {
  try {
    // Only allow admin/superadmin to cleanup OTPs
    if (!['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const result = await SQLiteOtpService.cleanupExpiredOTPs();
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Cleanup OTPs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup expired OTPs'
    });
  }
});

export default router;