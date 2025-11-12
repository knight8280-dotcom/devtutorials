/**
 * Stripe Service
 * Handle subscription payments and webhooks
 */

const Stripe = require('stripe');
const logger = require('../utils/logger');
const User = require('../models/User');
const StripeWebhookEvent = require('../models/StripeWebhookEvent');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Create Stripe checkout session for subscription
 */
const createCheckoutSession = async (userId, priceId, successUrl, cancelUrl) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Create or retrieve Stripe customer
    let customerId = user.subscription.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user._id.toString(),
          username: user.username
        }
      });
      
      customerId = customer.id;
      user.subscription.stripeCustomerId = customerId;
      await user.save();
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: user._id.toString()
      },
      subscription_data: {
        metadata: {
          userId: user._id.toString()
        }
      }
    });

    logger.info(`Created checkout session for user ${userId}`);

    return {
      sessionId: session.id,
      url: session.url
    };
  } catch (error) {
    logger.error('Error creating checkout session:', error);
    throw error;
  }
};

/**
 * Create customer portal session
 */
const createPortalSession = async (userId, returnUrl) => {
  try {
    const user = await User.findById(userId);
    
    if (!user || !user.subscription.stripeCustomerId) {
      throw new Error('No Stripe customer found');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.subscription.stripeCustomerId,
      return_url: returnUrl
    });

    return { url: session.url };
  } catch (error) {
    logger.error('Error creating portal session:', error);
    throw error;
  }
};

/**
 * Handle webhook events
 */
const handleWebhook = async (rawBody, signature) => {
  try {
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // Log webhook event
    const webhookLog = await StripeWebhookEvent.create({
      stripeEventId: event.id,
      type: event.type,
      data: event.data.object,
      receivedAt: new Date()
    });

    logger.info(`Received Stripe webhook: ${event.type}`);

    // Process event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      default:
        logger.info(`Unhandled webhook event type: ${event.type}`);
    }

    // Mark as processed
    webhookLog.processed = true;
    webhookLog.processedAt = new Date();
    await webhookLog.save();

    return { received: true };
  } catch (error) {
    logger.error('Webhook processing error:', error);
    throw error;
  }
};

/**
 * Handle checkout session completed
 */
const handleCheckoutCompleted = async (session) => {
  const userId = session.metadata.userId;
  const customerId = session.customer;
  const subscriptionId = session.subscription;

  const user = await User.findById(userId);
  if (!user) return;

  user.subscription.stripeCustomerId = customerId;
  user.subscription.stripeSubscriptionId = subscriptionId;
  user.subscription.status = 'active';
  user.subscription.tier = 'premium';
  
  await user.save();

  logger.info(`Subscription activated for user ${userId}`);
};

/**
 * Handle subscription update
 */
const handleSubscriptionUpdate = async (subscription) => {
  const customerId = subscription.customer;
  
  const user = await User.findOne({ 'subscription.stripeCustomerId': customerId });
  if (!user) return;

  user.subscription.status = subscription.status;
  user.subscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
  user.subscription.cancelAtPeriodEnd = subscription.cancel_at_period_end;
  
  if (subscription.status === 'active') {
    user.subscription.tier = 'premium';
  }
  
  await user.save();

  logger.info(`Subscription updated for customer ${customerId}`);
};

/**
 * Handle subscription deleted
 */
const handleSubscriptionDeleted = async (subscription) => {
  const customerId = subscription.customer;
  
  const user = await User.findOne({ 'subscription.stripeCustomerId': customerId });
  if (!user) return;

  user.subscription.status = 'cancelled';
  user.subscription.tier = 'free';
  
  await user.save();

  logger.info(`Subscription cancelled for customer ${customerId}`);
};

/**
 * Handle payment succeeded
 */
const handlePaymentSucceeded = async (invoice) => {
  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;
  
  const user = await User.findOne({ 'subscription.stripeCustomerId': customerId });
  if (!user) return;

  logger.info(`Payment succeeded for customer ${customerId}, amount: ${invoice.amount_paid / 100}`);
};

/**
 * Handle payment failed
 */
const handlePaymentFailed = async (invoice) => {
  const customerId = invoice.customer;
  
  const user = await User.findOne({ 'subscription.stripeCustomerId': customerId });
  if (!user) return;

  logger.warn(`Payment failed for customer ${customerId}`);
  
  // Send email notification (implement via email service)
  // await sendPaymentFailedEmail(user);
};

/**
 * Cancel subscription
 */
const cancelSubscription = async (userId) => {
  try {
    const user = await User.findById(userId);
    
    if (!user || !user.subscription.stripeSubscriptionId) {
      throw new Error('No active subscription found');
    }

    await stripe.subscriptions.update(user.subscription.stripeSubscriptionId, {
      cancel_at_period_end: true
    });

    user.subscription.cancelAtPeriodEnd = true;
    await user.save();

    logger.info(`Subscription cancellation scheduled for user ${userId}`);

    return { success: true };
  } catch (error) {
    logger.error('Error cancelling subscription:', error);
    throw error;
  }
};

module.exports = {
  createCheckoutSession,
  createPortalSession,
  handleWebhook,
  cancelSubscription
};
