/**
 * Error Handler Middleware
 * Centralized error handling
 */

const logger = require('../utils/logger');

/**
 * Not Found handler
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Global error handler
 */
const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.userId
  });

  // Determine status code
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Handle specific error types
  let message = err.message;
  let code = err.code || 'INTERNAL_ERROR';

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors).map(e => e.message).join(', ');
    code = 'VALIDATION_ERROR';
    res.status(400);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    message = `${field} already exists`;
    code = 'DUPLICATE_ERROR';
    res.status(409);
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    message = 'Invalid ID format';
    code = 'INVALID_ID';
    res.status(400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
    res.status(401);
  }

  if (err.name === 'TokenExpiredError') {
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
    res.status(401);
  }

  // Stripe errors
  if (err.type && err.type.startsWith('Stripe')) {
    message = 'Payment processing error';
    code = 'PAYMENT_ERROR';
    res.status(402);
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    code,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = {
  notFound,
  errorHandler
};
