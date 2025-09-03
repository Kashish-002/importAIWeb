import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from'express-mongo-sanitize';
import { body }  from 'express-validator';

// Security headers middleware
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
});

// Rate limiting configurations
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message,
        retryAfter: Math.round(windowMs / 1000)
      });
    }
  });
};

// Different rate limits for different endpoints
const rateLimits = {
  // General API rate limit
  general: createRateLimit(
    15 * 60 * 1000, // 15 minutes
    100, // 100 requests per window
    'Too many requests from this IP. Please try again later.'
  ),

  // Auth endpoints (stricter)
  auth: createRateLimit(
    15 * 60 * 1000, // 15 minutes
    5, // 5 attempts per window
    'Too many authentication attempts. Please try again later.'
  ),

  // Blog creation (moderate)
  blogCreate: createRateLimit(
    60 * 60 * 1000, // 1 hour
    10, // 10 blog posts per hour
    'Too many blog posts created. Please try again later.'
  ),

  // Comments (moderate)
  comments: createRateLimit(
    15 * 60 * 1000, // 15 minutes
    20, // 20 comments per window
    'Too many comments posted. Please try again later.'
  )
};

// MongoDB injection protection
const mongoSanitizeOptions = {
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`Sanitized key: ${key} in request from ${req.ip}`);
  }
};

// Input sanitization rules
const sanitizeInput = [
  body('*').trim().escape()
];

// Content sanitization for rich text fields
const sanitizeContent = (req, res, next) => {
  // Fields that should allow HTML but need sanitization
  const richTextFields = ['content', 'text', 'description'];
  
  richTextFields.forEach(field => {
    if (req.body[field]) {
      // Basic HTML sanitization - remove script tags and dangerous attributes
      req.body[field] = req.body[field]
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+="[^"]*"/gi, '')
        .replace(/on\w+='[^']*'/gi, '');
    }
  });
  
  next();
};

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000', // React dev server
      'http://localhost:5173', // Vite dev server
       'http://localhost:8080',
      process.env.CLIENT_URL
    ].filter(Boolean);

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count']
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  
  // Log response when finished
  const originalSend = res.send;
  res.send = function(body) {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    return originalSend.call(this, body);
  };
  
  next();
};

// Security validation middleware
const validateSecureRequest = (req, res, next) => {
  // Check for suspicious patterns in URL
  const suspiciousPatterns = [
    /\.\./,  // Path traversal
    /[<>]/,  // HTML injection attempts
    /union.*select/i,  // SQL injection attempts
    /script/i  // Script injection attempts
  ];

  const url = req.originalUrl.toLowerCase();
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(url));

  if (isSuspicious) {
    console.warn(`Suspicious request blocked: ${req.method} ${req.originalUrl} from ${req.ip}`);
    return res.status(400).json({
      success: false,
      message: 'Invalid request format'
    });
  }

  next();
};

// Error handling for security middleware
const securityErrorHandler = (err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'Cross-origin request not allowed'
    });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Request payload too large'
    });
  }

  next(err);
};

// ES6 exports
export {
  securityHeaders,
  rateLimits,
  sanitizeInput,
  sanitizeContent,
  corsOptions,
  requestLogger,
  validateSecureRequest,
  securityErrorHandler,
  mongoSanitize
};

// Export mongoSanitize with options applied
// export const mongoSanitize = mongoSanitize(mongoSanitizeOptions);