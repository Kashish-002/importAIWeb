import dotenv from 'dotenv';
import mongoose from 'mongoose';
dotenv.config();
import {
  securityHeaders,
  rateLimits,
  mongoSanitize,
  corsOptions,
  requestLogger,
  validateSecureRequest,
  securityErrorHandler,

} from './middleware/security.js';

// Import routes
import authRoutes from './routes/auth.js';
import express from "express";
import cors from "cors";  
import cookieParser from "cookie-parser"; 

import connectDB from "./config/db.js";

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Security middleware (apply early)
app.use(securityHeaders);
app.use(validateSecureRequest);

// CORS configuration
app.use(cors(corsOptions));

// Request logging (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use(requestLogger);
}

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  type: 'application/json'
}));
app.use(express.urlencoded({ 
  extended: true,
  limit: '10mb'
}));

// Cookie parsing
app.use(cookieParser());

// MongoDB injection protection
app.use(mongoSanitize);

// Apply general rate limiting
app.use('/api', rateLimits.general);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Import AI API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Import AI API',
    documentation: '/api/docs',
    health: '/api/health'
  });
});

// Security error handler
app.use(securityErrorHandler);

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', {
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors
    });
  }

  // Mongoose cast errors (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }

  // MongoDB duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }

  // JSON parsing errors
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON format'
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err
    })
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Promise Rejection:', err.message);
  console.error('Promise:', promise);
  
  // Close server & exit process
  if (server) {
    server.close(() => {
      console.log('Server closed due to unhandled promise rejection');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  console.error('Stack:', err.stack);
  
  // Close server & exit process
  if (server) {
    server.close(() => {
      console.log('Server closed due to uncaught exception');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  if (server) {
    server.close((err) => {
      if (err) {
        console.error('Error during server close:', err);
        process.exit(1);
      }
      
      console.log('HTTP server closed');
      
      // Close MongoDB connection
     
      mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed');
        process.exit(0);
      });
    });
  }
};

// Listen for shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`
  🚀 Import AI API Server is running!
  
  📍 Environment: ${process.env.NODE_ENV}
  🔗 Port: ${PORT}
  🌐 URL: http://localhost:${PORT}
  💾 Database: ${process.env.MONGO_URI ? 'MongoDB Connected' : 'No DB URL'}
  🔐 JWT Secret: ${process.env.JWT_SECRET ? 'Set' : 'Not Set'}
  
  📋 Available Endpoints:
  • GET  /                    - API info
  • GET  /api/health          - Health check
  • POST /api/auth/register   - User registration
  • POST /api/auth/login      - User login
  • POST /api/auth/logout     - User logout
  • POST /api/auth/refresh    - Refresh token
  • GET  /api/auth/me         - Get current user
  • PUT  /api/auth/profile    - Update profile
  • POST /api/auth/change-password - Change password
  `);
});

export default app;