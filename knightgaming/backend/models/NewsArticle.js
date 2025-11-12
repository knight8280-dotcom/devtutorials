/**
 * NewsArticle Model
 * Gaming news from external APIs and manual admin entries
 */

const mongoose = require('mongoose');

const newsArticleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  slug: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  summary: {
    type: String,
    required: true,
    maxlength: 500
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: String,
    default: 'KnightGaming Staff'
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Media
  featuredImage: {
    type: String,
    required: true
  },
  images: [String],
  videoUrl: String,
  
  // Categories and tags
  category: {
    type: String,
    enum: ['news', 'review', 'guide', 'announcement', 'patch-notes', 'industry', 'esports'],
    default: 'news',
    index: true
  },
  tags: [String],
  games: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game'
  }],
  
  // External source
  sourceType: {
    type: String,
    enum: ['manual', 'newsapi', 'rss', 'steam'],
    default: 'manual'
  },
  sourceUrl: String,
  sourceName: String,
  externalId: String,
  
  // Publishing
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published',
    index: true
  },
  publishedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Premium content
  isPremium: {
    type: Boolean,
    default: false
  },
  
  // Engagement metrics
  views: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  
  // AI generated content
  aiSummary: {
    generated: {
      type: Boolean,
      default: false
    },
    content: String,
    generatedAt: Date,
    model: String
  },
  
  // SEO
  metaDescription: String,
  metaKeywords: [String],
  
  // Comments
  commentsEnabled: {
    type: Boolean,
    default: true
  },
  commentCount: {
    type: Number,
    default: 0
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
newsArticleSchema.index({ category: 1, publishedAt: -1 });
newsArticleSchema.index({ status: 1, publishedAt: -1 });
newsArticleSchema.index({ tags: 1 });
newsArticleSchema.index({ games: 1 });
newsArticleSchema.index({ title: 'text', content: 'text', summary: 'text' });

// Increment views
newsArticleSchema.methods.incrementViews = async function() {
  this.views += 1;
  await this.save();
};

module.exports = mongoose.model('NewsArticle', newsArticleSchema);
