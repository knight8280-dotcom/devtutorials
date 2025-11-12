/**
 * Validation Utilities
 * Common validation functions and express-validator chains
 */

const { body, param, query, validationResult } = require('express-validator');

// Validation result handler
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

// User validation chains
const userValidators = {
  register: [
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
      .trim()
      .isEmail()
      .withMessage('Must be a valid email address')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
  ],
  login: [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Must be a valid email address')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  updateProfile: [
    body('displayName')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Display name must be less than 50 characters'),
    body('bio')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Bio must be less than 500 characters')
  ]
};

// Review validation chains
const reviewValidators = {
  create: [
    body('gameId')
      .notEmpty()
      .withMessage('Game ID is required')
      .isMongoId()
      .withMessage('Invalid game ID'),
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('title')
      .trim()
      .isLength({ min: 5, max: 100 })
      .withMessage('Title must be between 5 and 100 characters'),
    body('content')
      .trim()
      .isLength({ min: 50, max: 5000 })
      .withMessage('Review content must be between 50 and 5000 characters'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    body('hoursPlayed')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Hours played must be a positive number')
  ]
};

// Leaderboard validation chains
const leaderboardValidators = {
  submit: [
    body('gameId')
      .notEmpty()
      .withMessage('Game ID is required')
      .isMongoId()
      .withMessage('Invalid game ID'),
    body('score')
      .isNumeric()
      .withMessage('Score must be a number'),
    body('category')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Category must be less than 50 characters'),
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata must be an object')
  ]
};

// News validation chains
const newsValidators = {
  create: [
    body('title')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Title must be between 5 and 200 characters'),
    body('summary')
      .trim()
      .isLength({ min: 10, max: 500 })
      .withMessage('Summary must be between 10 and 500 characters'),
    body('content')
      .trim()
      .isLength({ min: 50 })
      .withMessage('Content must be at least 50 characters'),
    body('category')
      .isIn(['news', 'review', 'guide', 'announcement', 'patch-notes', 'industry', 'esports'])
      .withMessage('Invalid category'),
    body('featuredImage')
      .trim()
      .isURL()
      .withMessage('Featured image must be a valid URL')
  ]
};

// AI request validation
const aiValidators = {
  summarize: [
    body('text')
      .trim()
      .isLength({ min: 50, max: 10000 })
      .withMessage('Text must be between 50 and 10000 characters'),
    body('maxWords')
      .optional()
      .isInt({ min: 20, max: 200 })
      .withMessage('Max words must be between 20 and 200')
  ],
  trendHighlight: [
    body('gameId')
      .notEmpty()
      .withMessage('Game ID is required')
      .isMongoId()
      .withMessage('Invalid game ID'),
    body('timeRange')
      .optional()
      .isIn(['24h', '48h', '7d', '30d'])
      .withMessage('Invalid time range')
  ]
};

// Query validators
const queryValidators = {
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],
  search: [
    query('q')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Search query must be between 2 and 100 characters')
  ]
};

// Sanitization helpers
const sanitizeHtml = (text) => {
  if (!text) return text;
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
};

module.exports = {
  validate,
  userValidators,
  reviewValidators,
  leaderboardValidators,
  newsValidators,
  aiValidators,
  queryValidators,
  sanitizeHtml
};
