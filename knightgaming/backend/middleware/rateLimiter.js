/**
 * Rate Limiter Middleware
 * Protect API endpoints from abuse
 */

const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later'
    });
  }
});

// Strict limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: {
    success: false,
    message: 'Too many login attempts, please try again later'
  },
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again in 15 minutes'
    });
  }
});

// AI endpoint limiter
const aiLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: parseInt(process.env.RATE_LIMIT_AI_MAX) || 10,
  message: {
    success: false,
    message: 'Daily AI request limit reached'
  },
  keyGenerator: (req) => {
    // Rate limit by user ID if authenticated, otherwise by IP
    return req.userId ? req.userId.toString() : req.ip;
  },
  handler: (req, res) => {
    logger.warn(`AI rate limit exceeded for user: ${req.userId || req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Daily AI request limit reached. Upgrade to Premium for higher limits.'
    });
  }
});

// Premium users get higher AI limits
const premiumAiLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 100, // 10x the free tier
  message: {
    success: false,
    message: 'Daily AI request limit reached'
  },
  keyGenerator: (req) => {
    return req.userId ? req.userId.toString() : req.ip;
  },
  skip: (req) => {
    // Skip rate limiting for premium users up to their higher limit
    return req.user && !req.user.isPremium();
  }
});

// Webhook limiter (more lenient)
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50,
  message: {
    success: false,
    message: 'Webhook rate limit exceeded'
  }
});

// Admin action limiter
const adminLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30,
  message: {
    success: false,
    message: 'Too many admin actions, please slow down'
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  aiLimiter,
  premiumAiLimiter,
  webhookLimiter,
  adminLimiter
};
