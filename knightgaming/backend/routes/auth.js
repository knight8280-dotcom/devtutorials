/**
 * Authentication Routes
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { userValidators, validate } = require('../utils/validators');

// Public routes
router.post('/register', 
  authLimiter,
  userValidators.register,
  validate,
  authController.register
);

router.post('/login',
  authLimiter,
  userValidators.login,
  validate,
  authController.login
);

router.post('/refresh-token',
  authController.refreshToken
);

router.post('/request-reset',
  authLimiter,
  authController.requestPasswordReset
);

router.post('/reset-password',
  authLimiter,
  authController.resetPassword
);

// Protected routes
router.post('/logout',
  authenticate,
  authController.logout
);

router.get('/profile',
  authenticate,
  authController.getProfile
);

router.put('/profile',
  authenticate,
  userValidators.updateProfile,
  validate,
  authController.updateProfile
);

router.put('/preferences',
  authenticate,
  authController.updatePreferences
);

router.delete('/account',
  authenticate,
  authController.deleteAccount
);

module.exports = router;
