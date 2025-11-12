/**
 * Games Routes
 */

const express = require('express');
const router = express.Router();
const gamesController = require('../controllers/gamesController');
const { optionalAuth, authenticate, requirePremium } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const { queryValidators, validate } = require('../utils/validators');

// Public routes (with optional auth for premium features)
router.get('/',
  apiLimiter,
  queryValidators.pagination,
  validate,
  gamesController.getGames
);

router.get('/trending',
  apiLimiter,
  gamesController.getTrendingGames
);

router.get('/featured',
  apiLimiter,
  gamesController.getFeaturedGames
);

router.get('/search',
  apiLimiter,
  queryValidators.search,
  validate,
  gamesController.searchGames
);

router.get('/genres',
  apiLimiter,
  gamesController.getGenres
);

router.get('/platforms',
  apiLimiter,
  gamesController.getPlatforms
);

router.get('/:id',
  apiLimiter,
  gamesController.getGame
);

router.get('/:id/player-count',
  apiLimiter,
  gamesController.getPlayerCount
);

router.get('/:id/player-count/history',
  apiLimiter,
  gamesController.getPlayerCountHistory
);

// Premium-only detailed stats
router.get('/:id/stats',
  authenticate,
  requirePremium,
  gamesController.getGameStats
);

module.exports = router;
