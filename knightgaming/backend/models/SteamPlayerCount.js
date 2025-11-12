/**
 * SteamPlayerCount Model
 * Time series data for tracking player counts over time
 */

const mongoose = require('mongoose');

const steamPlayerCountSchema = new mongoose.Schema({
  game: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true,
    index: true
  },
  steamAppId: {
    type: Number,
    required: true,
    index: true
  },
  playerCount: {
    type: Number,
    required: true,
    min: 0
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  // Store hour for aggregation queries
  hour: {
    type: Number,
    min: 0,
    max: 23
  },
  dayOfWeek: {
    type: Number,
    min: 0,
    max: 6
  }
}, {
  timestamps: false
});

// Compound indexes for efficient time-based queries
steamPlayerCountSchema.index({ game: 1, timestamp: -1 });
steamPlayerCountSchema.index({ steamAppId: 1, timestamp: -1 });
steamPlayerCountSchema.index({ timestamp: -1 });

// TTL index to automatically delete old data after 90 days
steamPlayerCountSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

// Pre-save hook to set hour and dayOfWeek
steamPlayerCountSchema.pre('save', function(next) {
  if (this.timestamp) {
    this.hour = this.timestamp.getHours();
    this.dayOfWeek = this.timestamp.getDay();
  }
  next();
});

module.exports = mongoose.model('SteamPlayerCount', steamPlayerCountSchema);
