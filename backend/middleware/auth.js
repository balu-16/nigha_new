import jwt from 'jsonwebtoken';
import { dbHelpers } from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'nightech-super-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Generate JWT token
export const generateToken = (user) => {
  const payload = {
    id: user.id,
    phone: user.phone,
    role: user.role,
    name: user.name
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Verify JWT token middleware
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }

  jwt.verify(token, JWT_SECRET, async (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }

    // Verify user still exists in database
    try {
      const dbUser = await dbHelpers.getUserById(user.id);
      if (!dbUser) {
        return res.status(403).json({ 
          success: false, 
          message: 'User no longer exists' 
        });
      }

      req.user = {
        id: dbUser.id,
        phone: dbUser.phone,
        role: dbUser.role,
        name: dbUser.name,
        email: dbUser.email
      };
      next();
    } catch (error) {
      console.error('Error verifying user in database:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Authentication error' 
      });
    }
  });
};

// Role-based authorization middleware
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. Required roles: ${roles.join(', ')}` 
      });
    }

    next();
  };
};

// Admin only middleware
export const adminOnly = authorizeRoles('admin', 'superadmin');

// SuperAdmin only middleware
export const superAdminOnly = authorizeRoles('superadmin');

// Customer or higher middleware
export const customerOrHigher = authorizeRoles('customer', 'admin', 'superadmin');

export default {
  generateToken,
  authenticateToken,
  authorizeRoles,
  adminOnly,
  superAdminOnly,
  customerOrHigher
};