/**
 * Reviews Routes
 */

const express = require('express');
const router = express.Router();
const reviewsController = require('../controllers/reviewsController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const { reviewValidators, validate, queryValidators } = require('../utils/validators');

// Public routes
router.get('/game/:gameId',
  apiLimiter,
  queryValidators.pagination,
  validate,
  optionalAuth,
  reviewsController.getGameReviews
);

router.get('/:id',
  apiLimiter,
  reviewsController.getReview
);

// Protected routes
router.get('/user/my-reviews',
  authenticate,
  queryValidators.pagination,
  validate,
  reviewsController.getUserReviews
);

router.post('/',
  authenticate,
  apiLimiter,
  reviewValidators.create,
  validate,
  reviewsController.createReview
);

router.put('/:id',
  authenticate,
  apiLimiter,
  reviewsController.updateReview
);

router.delete('/:id',
  authenticate,
  reviewsController.deleteReview
);

router.post('/:id/vote',
  authenticate,
  reviewsController.voteReview
);

router.post('/:id/flag',
  authenticate,
  reviewsController.flagReview
);

module.exports = router;
