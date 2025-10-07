import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/auth.js';
import deviceRoutes from './routes/devices.js';
import adminRoutes from './routes/admin.js';

// Import database to initialize
import './config/database.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});

// OTP-specific rate limiting (more restrictive)
const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // limit each IP to 5 OTP requests per 5 minutes
  message: {
    success: false,
    message: 'Too many OTP requests. Please wait 5 minutes before trying again.'
  }
});

app.use(limiter);

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://localhost:3000',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined'));

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'NighaTech Industrial Dashboard API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/devices', deviceRoutes);
app.use('/admin', adminRoutes);

// Apply OTP rate limiting to specific endpoints
app.use('/auth/send-otp', otpLimiter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to NighaTech Industrial Dashboard API',
    version: '1.0.0',
    endpoints: {
      auth: {
        signup: 'POST /auth/signup',
        sendOtp: 'POST /auth/send-otp',
        verifyOtp: 'POST /auth/verify-otp',
        profile: 'GET /auth/profile',
        logout: 'POST /auth/logout'
      },
      devices: {
        add: 'POST /devices/add',
        list: 'GET /devices/list',
        my: 'GET /devices/my',
        getByCode: 'GET /devices/:deviceCode',
        assign: 'PUT /devices/:deviceCode/assign',
        delete: 'DELETE /devices/:deviceCode'
      },
      admin: {
        logs: 'GET /admin/logs',
        users: 'GET /admin/users',
        createUser: 'POST /admin/users',
        updateUserRole: 'PUT /admin/users/:userId/role',
        deleteUser: 'DELETE /admin/users/:userId',
        stats: 'GET /admin/stats'
      }
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 NighaTech Industrial Dashboard API Server Started
📡 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:8080'}
📱 Default Admin Phone: 8888888888
📱 Default SuperAdmin Phone: 9999999999
⏰ Started at: ${new Date().toISOString()}
  `);
});

export default app;