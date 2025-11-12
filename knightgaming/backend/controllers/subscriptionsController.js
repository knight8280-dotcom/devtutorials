/**
 * Subscriptions Controller
 * Handle Stripe subscription management
 */

const {
  createCheckoutSession,
  createPortalSession,
  cancelSubscription
} = require('../services/stripeService');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Create checkout session
 */
const createCheckout = async (req, res, next) => {
  try {
    const priceId = process.env.STRIPE_MONTHLY_PRICE_ID;

    if (!priceId) {
      return res.status(500).json({
        success: false,
        message: 'Subscription price not configured'
      });
    }

    const successUrl = `${process.env.CLIENT_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.CLIENT_URL}/subscription`;

    const session = await createCheckoutSession(
      req.userId,
      priceId,
      successUrl,
      cancelUrl
    );

    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        url: session.url
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create customer portal session
 */
const createPortal = async (req, res, next) => {
  try {
    const returnUrl = `${process.env.CLIENT_URL}/account`;

    const session = await createPortalSession(req.userId, returnUrl);

    res.json({
      success: true,
      data: {
        url: session.url
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get subscription status
 */
const getStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select('subscription');

    res.json({
      success: true,
      data: {
        subscription: user.subscription,
        isPremium: user.isPremium()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel subscription
 */
const cancel = async (req, res, next) => {
  try {
    await cancelSubscription(req.userId);

    res.json({
      success: true,
      message: 'Subscription will be cancelled at the end of the billing period'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get subscription plans
 */
const getPlans = async (req, res, next) => {
  try {
    const plans = [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        currency: 'USD',
        interval: 'month',
        features: [
          'Live player counts',
          'Basic news access',
          'Community features',
          'Limited leaderboard entries',
          'Standard support'
        ]
      },
      {
        id: 'premium',
        name: 'Premium',
        price: 1.99,
        currency: 'USD',
        interval: 'month',
        stripePriceId: process.env.STRIPE_MONTHLY_PRICE_ID,
        features: [
          'All Free features',
          'Ad-free experience',
          'Detailed statistics',
          'AI-powered summaries (100/day)',
          'Premium news content',
          'Advanced analytics',
          'Priority support',
          'Early feature access'
        ]
      }
    ];

    res.json({
      success: true,
      data: { plans }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCheckout,
  createPortal,
  getStatus,
  cancel,
  getPlans
};
