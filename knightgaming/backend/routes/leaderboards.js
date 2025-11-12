/**
 * Leaderboards Routes
 */

const express = require('express');
const router = express.Router();
const leaderboardsController = require('../controllers/leaderboardsController');
const { authenticate } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const { leaderboardValidators, validate, queryValidators } = require('../utils/validators');

// Public routes
router.get('/game/:gameId',
  apiLimiter,
  queryValidators.pagination,
  validate,
  leaderboardsController.getLeaderboard
);

router.get('/game/:gameId/categories',
  apiLimiter,
  leaderboardsController.getCategories
);

// Protected routes
router.get('/user/my-entries',
  authenticate,
  queryValidators.pagination,
  validate,
  leaderboardsController.getUserEntries
);

router.get('/game/:gameId/my-rank',
  authenticate,
  leaderboardsController.getUserRank
);

router.post('/',
  authenticate,
  apiLimiter,
  leaderboardValidators.submit,
  validate,
  leaderboardsController.submitEntry
);

router.delete('/:id',
  authenticate,
  leaderboardsController.deleteEntry
);

module.exports = router;
