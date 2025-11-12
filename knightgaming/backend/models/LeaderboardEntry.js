/**
 * LeaderboardEntry Model
 * Track player achievements and high scores
 */

const mongoose = require('mongoose');

const leaderboardEntrySchema = new mongoose.Schema({
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
  playerName: {
    type: String,
    required: true,
    trim: true
  },
  score: {
    type: Number,
    required: true,
    index: true
  },
  rank: {
    type: Number,
    index: true
  },
  category: {
    type: String,
    default: 'general',
    index: true
  },
  metadata: {
    level: Number,
    timePlayed: Number,
    accuracy: Number,
    kills: Number,
    deaths: Number,
    winRate: Number,
    customData: mongoose.Schema.Types.Mixed
  },
  proof: {
    screenshotUrl: String,
    videoUrl: String,
    replayFile: String
  },
  // Anti-cheat and moderation
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'flagged'],
    default: 'pending',
    index: true
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  rejectionReason: String,
  
  // Anti-cheat flags
  antiCheatFlags: [{
    flag: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    details: String,
    flaggedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Time tracking
  submittedAt: {
    type: Date,
    default: Date.now
  },
  achievedAt: {
    type: Date,
    required: true
  },
  
  // Season tracking
  season: {
    type: String,
    index: true
  },
  
  isActive: {
    type: Boolean,
    default: true
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

// Compound indexes for leaderboard queries
leaderboardEntrySchema.index({ game: 1, category: 1, score: -1, status: 1 });
leaderboardEntrySchema.index({ game: 1, season: 1, score: -1 });
leaderboardEntrySchema.index({ user: 1, game: 1, category: 1 });

// Prevent duplicate entries
leaderboardEntrySchema.index(
  { game: 1, user: 1, category: 1, season: 1 },
  { unique: true, sparse: true }
);

// Method to run basic anti-cheat heuristics
leaderboardEntrySchema.methods.runAntiCheatCheck = function() {
  const flags = [];
  
  // Check if score is unrealistically high
  if (this.score > 1000000) {
    flags.push({
      flag: 'suspicious_score',
      severity: 'high',
      details: 'Score exceeds typical maximum values'
    });
  }
  
  // Check if time played makes sense for score
  if (this.metadata && this.metadata.timePlayed && this.metadata.timePlayed < 60 && this.score > 10000) {
    flags.push({
      flag: 'score_time_mismatch',
      severity: 'medium',
      details: 'High score achieved in unrealistically short time'
    });
  }
  
  // Check accuracy if applicable
  if (this.metadata && this.metadata.accuracy && this.metadata.accuracy > 98) {
    flags.push({
      flag: 'suspicious_accuracy',
      severity: 'medium',
      details: 'Accuracy exceeds human capabilities'
    });
  }
  
  this.antiCheatFlags = flags;
  return flags.length > 0;
};

module.exports = mongoose.model('LeaderboardEntry', leaderboardEntrySchema);
