/**
 * Admin Routes
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');
const { adminLimiter } = require('../middleware/rateLimiter');
const { newsValidators, validate, queryValidators } = require('../utils/validators');

// All admin routes require authentication and admin/moderator role
router.use(authenticate);
router.use(authorize('admin', 'moderator'));
router.use(adminLimiter);

// Dashboard
router.get('/dashboard',
  adminController.getDashboardStats
);

// User management
router.get('/users',
  queryValidators.pagination,
  validate,
  adminController.getUsers
);

router.put('/users/:userId/role',
  authorize('admin'), // Only admins can change roles
  adminController.updateUserRole
);

// Review moderation
router.get('/reviews/pending',
  queryValidators.pagination,
  validate,
  adminController.getPendingReviews
);

router.put('/reviews/:reviewId/moderate',
  adminController.moderateReview
);

// Leaderboard verification
router.get('/leaderboards/pending',
  queryValidators.pagination,
  validate,
  adminController.getPendingLeaderboard
);

router.put('/leaderboards/:entryId/verify',
  adminController.verifyLeaderboardEntry
);

// News management
router.post('/news',
  newsValidators.create,
  validate,
  adminController.createNews
);

router.put('/news/:articleId',
  adminController.updateNews
);

router.delete('/news/:articleId',
  adminController.deleteNews
);

// Webhook logs
router.get('/webhooks',
  authorize('admin'),
  queryValidators.pagination,
  validate,
  adminController.getWebhookLogs
);

// Cache management
router.post('/cache/flush',
  authorize('admin'),
  adminController.flushCache
);

module.exports = router;
