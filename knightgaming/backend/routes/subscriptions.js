/**
 * Subscriptions Routes
 */

const express = require('express');
const router = express.Router();
const subscriptionsController = require('../controllers/subscriptionsController');
const { authenticate } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

// Public route
router.get('/plans',
  apiLimiter,
  subscriptionsController.getPlans
);

// Protected routes
router.use(authenticate);

router.post('/checkout',
  apiLimiter,
  subscriptionsController.createCheckout
);

router.post('/portal',
  apiLimiter,
  subscriptionsController.createPortal
);

router.get('/status',
  subscriptionsController.getStatus
);

router.post('/cancel',
  subscriptionsController.cancel
);

module.exports = router;
