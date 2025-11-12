/**
 * Review Model
 * User reviews for games with ratings and moderation
 */

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  game: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Title must be less than 100 characters']
  },
  content: {
    type: String,
    required: true,
    trim: true,
    minlength: [50, 'Review must be at least 50 characters'],
    maxlength: [5000, 'Review must be less than 5000 characters']
  },
  tags: [{
    type: String,
    enum: ['gameplay', 'graphics', 'story', 'multiplayer', 'performance', 'value', 'audio', 'controls']
  }],
  hoursPlayed: {
    type: Number,
    min: 0
  },
  recommendGame: {
    type: Boolean,
    default: true
  },
  // Moderation
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'pending',
    index: true
  },
  moderationNotes: String,
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderatedAt: Date,
  
  // User engagement
  helpfulCount: {
    type: Number,
    default: 0
  },
  notHelpfulCount: {
    type: Number,
    default: 0
  },
  helpfulVotes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isHelpful: Boolean,
    votedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Flags for inappropriate content
  flags: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    flaggedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Steam import
  importedFromSteam: {
    type: Boolean,
    default: false
  },
  steamReviewId: String,
  
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  
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

// Compound indexes
reviewSchema.index({ game: 1, status: 1, createdAt: -1 });
reviewSchema.index({ user: 1, createdAt: -1 });
reviewSchema.index({ game: 1, user: 1 }, { unique: true }); // One review per user per game

// Calculate helpful ratio
reviewSchema.virtual('helpfulRatio').get(function() {
  const total = this.helpfulCount + this.notHelpfulCount;
  return total > 0 ? this.helpfulCount / total : 0;
});

module.exports = mongoose.model('Review', reviewSchema);
