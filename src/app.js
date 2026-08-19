const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const rateLimit = require('express-rate-limit');

const swaggerDocument = require('./config/swagger');
const errorHandler = require('./middleware/errorHandler');
const ApiError = require('./utils/ApiError');

// Route imports
const authRouter = require('./routes/auth');
const leadsRouter = require('./routes/leads');
const usersRouter = require('./routes/users');
const staffRouter = require('./routes/staff');
const dashboardRouter = require('./routes/dashboard');
const notificationsRouter = require('./routes/notifications');

const app = express();

// 1. Security Headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP in development for Swagger UI simplicity
}));

// 2. CORS configuration (allowing Vercel and local UI addresses)
const allowedOrigins = [
  process.env.FRONTEND_URL || 'https://crm-frontend-cz1a.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5001',
  'http://localhost:5173',
  'http://localhost:5174',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like Postman or server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
}));

// 3. Logger Middleware
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 4. Rate Limiting for Authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/auth/login', authLimiter);
app.use('/api/auth/login', authLimiter);

// 5. Body Parsers & Cookie Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 6. Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Default health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the Smart CRM Mulyaankan API!',
    documentation: '/api-docs',
    status: 'Healthy',
    timestamp: new Date().toISOString(),
  });
});

// 7. Mount Routers
// We mount routes with BOTH root-level prefixes and standard /api prefixes
// to ensure direct seamless integration with the frontend mock-request structures

// Auth Router
app.use('/auth', authRouter);
app.use('/api/auth', authRouter);

// Leads Router
app.use('/leads', leadsRouter);
app.use('/api/leads', leadsRouter);

// Users Router
app.use('/users', usersRouter);
app.use('/api/users', usersRouter);

// Staff Router
app.use('/staff', staffRouter);
app.use('/api/staff', staffRouter);

// Dashboard Router
app.use('/dashboard', dashboardRouter);
app.use('/api/dashboard', dashboardRouter);

// Notifications Router
app.use('/notifications', notificationsRouter);
app.use('/api/notifications', notificationsRouter);

// 8. 404 Route handler
app.use((req, res, next) => {
  next(ApiError.notFound(`Endpoint not found: ${req.method} ${req.originalUrl}`));
});

// 9. Centralized Error Handler
app.use(errorHandler);

module.exports = app;
