/**
 * AI Routes
 */

const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticate, requirePremium } = require('../middleware/auth');
const { aiLimiter, premiumAiLimiter } = require('../middleware/rateLimiter');
const { aiValidators, validate } = require('../utils/validators');

// All AI routes require authentication
router.use(authenticate);

// Free tier with rate limiting
router.post('/summarize',
  aiLimiter,
  aiValidators.summarize,
  validate,
  aiController.summarizeText
);

router.post('/highlight-trends',
  aiLimiter,
  aiValidators.trendHighlight,
  validate,
  aiController.highlightTrend
);

router.post('/social-suggest',
  aiLimiter,
  aiController.suggestSocialPosts
);

// Get cached summary
router.get('/summary/:articleId',
  aiController.getArticleSummary
);

// Premium with higher limits
router.post('/summarize-premium',
  requirePremium,
  premiumAiLimiter,
  aiValidators.summarize,
  validate,
  aiController.summarizeText
);

// Usage stats
router.get('/stats',
  aiController.getStats
);

module.exports = router;
