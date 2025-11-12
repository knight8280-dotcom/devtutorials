/**
 * AISummaryCache Model
 * Cache AI-generated content to reduce API costs and improve performance
 */

const mongoose = require('mongoose');

const aiSummaryCacheSchema = new mongoose.Schema({
  // Reference to content
  contentType: {
    type: String,
    enum: ['news', 'review', 'patch_notes', 'trend', 'social_post'],
    required: true,
    index: true
  },
  contentId: {
    type: String,
    required: true,
    index: true
  },
  
  // Input hash for cache key
  inputHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  inputText: String,
  
  // AI generation details
  summaryType: {
    type: String,
    enum: ['summary', 'trend_highlight', 'social_suggestion', 'analysis'],
    required: true
  },
  
  // Generated content
  output: {
    type: String,
    required: true
  },
  alternatives: [String], // Multiple suggestions for social posts
  
  // AI metadata
  model: {
    type: String,
    default: 'gpt-3.5-turbo'
  },
  tokensUsed: {
    prompt: Number,
    completion: Number,
    total: Number
  },
  cost: {
    type: Number,
    default: 0
  },
  
  // Quality metrics
  confidence: Number,
  moderationPassed: {
    type: Boolean,
    default: true
  },
  moderationFlags: [String],
  
  // Usage tracking
  hitCount: {
    type: Number,
    default: 0
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  
  // Cache control
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

// Compound index for lookups
aiSummaryCacheSchema.index({ contentType: 1, contentId: 1, summaryType: 1 });

// TTL index for automatic cleanup
aiSummaryCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to check if cache is still valid
aiSummaryCacheSchema.methods.isValid = function() {
  return this.expiresAt > new Date();
};

// Method to record a cache hit
aiSummaryCacheSchema.methods.recordHit = async function() {
  this.hitCount += 1;
  this.lastAccessed = new Date();
  await this.save();
};

module.exports = mongoose.model('AISummaryCache', aiSummaryCacheSchema);
