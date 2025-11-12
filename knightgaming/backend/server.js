/**
 * KnightGaming Backend Server
 * Main application entry point
 */

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');

const { connectDB } = require('./config/database');
const { connectRedis } = require('./config/redis');
const { initEmailTransporter } = require('./utils/email');
const logger = require('./utils/logger');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const gamesRoutes = require('./routes/games');
const reviewsRoutes = require('./routes/reviews');
const leaderboardsRoutes = require('./routes/leaderboards');
const newsRoutes = require('./routes/news');
const aiRoutes = require('./routes/ai');
const subscriptionsRoutes = require('./routes/subscriptions');
const adminRoutes = require('./routes/admin');
const webhooksRoutes = require('./routes/webhooks');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy (important for Hostinger deployment)
app.set('trust proxy', 1);

// Middleware for Stripe webhooks (raw body needed)
app.post('/api/webhooks/stripe', 
  express.raw({ type: 'application/json' }),
  (req, res, next) => {
    req.rawBody = req.body;
    next();
  }
);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Health check endpoint
app.get('/status', (req, res) => {
  res.json({
    success: true,
    message: 'KnightGaming API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// API documentation
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'KnightGaming API v1',
    endpoints: {
      auth: '/api/auth/*',
      games: '/api/games/*',
      reviews: '/api/reviews/*',
      leaderboards: '/api/leaderboards/*',
      news: '/api/news/*',
      ai: '/api/ai/*',
      subscriptions: '/api/subscriptions/*',
      admin: '/api/admin/*',
      webhooks: '/api/webhooks/*'
    },
    documentation: '/api/docs'
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/leaderboards', leaderboardsRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/webhooks', webhooksRoutes);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Initialize connections and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Connect to Redis (optional)
    if (process.env.REDIS_ENABLED === 'true') {
      connectRedis();
    }
    
    // Initialize email transporter
    initEmailTransporter();
    
    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 KnightGaming API server running on port ${PORT}`);
      logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/status`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          const { closeDB } = require('./config/database');
          const { closeRedis } = require('./config/redis');
          
          await closeDB();
          await closeRedis();
          
          logger.info('Database connections closed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;
