/**
 * Webhooks Routes
 * Handle external service webhooks (Stripe, etc.)
 */

const express = require('express');
const router = express.Router();
const { handleWebhook } = require('../services/stripeService');
const { webhookLimiter } = require('../middleware/rateLimiter');
const logger = require('../utils/logger');

/**
 * Stripe webhook handler
 * Note: Stripe webhooks require raw body, so this is handled differently in server.js
 */
router.post('/stripe',
  webhookLimiter,
  async (req, res) => {
    try {
      const signature = req.headers['stripe-signature'];
      
      if (!signature) {
        return res.status(400).json({
          success: false,
          message: 'Missing stripe-signature header'
        });
      }

      // The raw body is attached by middleware in server.js
      await handleWebhook(req.rawBody, signature);

      res.json({ received: true });
    } catch (error) {
      logger.error('Stripe webhook error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

module.exports = router;
