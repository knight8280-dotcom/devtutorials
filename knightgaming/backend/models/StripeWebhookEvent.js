/**
 * StripeWebhookEvent Model
 * Log all Stripe webhook events for reconciliation and debugging
 */

const mongoose = require('mongoose');

const stripeWebhookEventSchema = new mongoose.Schema({
  stripeEventId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    index: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  customerId: {
    type: String,
    index: true
  },
  subscriptionId: {
    type: String,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  processed: {
    type: Boolean,
    default: false,
    index: true
  },
  processedAt: Date,
  processingError: String,
  retryCount: {
    type: Number,
    default: 0
  },
  lastRetryAt: Date,
  receivedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false
});

// Index for queries
stripeWebhookEventSchema.index({ type: 1, processed: 1, receivedAt: -1 });
stripeWebhookEventSchema.index({ customerId: 1, receivedAt: -1 });

module.exports = mongoose.model('StripeWebhookEvent', stripeWebhookEventSchema);
