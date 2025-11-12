/**
 * News Routes
 */

const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const { optionalAuth, authenticate } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const { queryValidators, validate } = require('../utils/validators');

// Public routes (with optional auth for premium content)
router.get('/',
  apiLimiter,
  queryValidators.pagination,
  validate,
  optionalAuth,
  newsController.getNews
);

router.get('/headlines',
  apiLimiter,
  newsController.getHeadlines
);

router.get('/trending',
  apiLimiter,
  newsController.getTrendingNews
);

router.get('/categories',
  apiLimiter,
  newsController.getCategories
);

router.get('/tags',
  apiLimiter,
  newsController.getTags
);

router.get('/game/:gameId',
  apiLimiter,
  newsController.getGameNews
);

router.get('/:id',
  apiLimiter,
  optionalAuth,
  newsController.getArticle
);

// Protected routes
router.post('/:id/like',
  authenticate,
  newsController.likeArticle
);

router.post('/:id/share',
  authenticate,
  newsController.shareArticle
);

module.exports = router;
