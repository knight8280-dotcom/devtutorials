/**
 * Game Model
 * Stores game metadata from RAWG/IGDB and Steam
 */

const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  // Primary identifiers
  steamAppId: {
    type: Number,
    sparse: true,
    index: true
  },
  rawgId: {
    type: Number,
    sparse: true
  },
  igdbId: {
    type: Number,
    sparse: true
  },
  
  // Basic info
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  slug: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  description: String,
  shortDescription: String,
  
  // Media
  headerImage: String,
  backgroundImage: String,
  screenshots: [String],
  trailerUrl: String,
  
  // Metadata
  releaseDate: Date,
  genres: [String],
  tags: [String],
  platforms: [String],
  developers: [String],
  publishers: [String],
  
  // Ratings
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  ratingsCount: {
    type: Number,
    default: 0
  },
  metacriticScore: Number,
  
  // Steam specific
  steamData: {
    price: Number,
    currency: String,
    isFree: Boolean,
    achievements: Number,
    recommendations: Number,
    categories: [String],
    languages: [String]
  },
  
  // Stats
  currentPlayers: {
    type: Number,
    default: 0
  },
  peakPlayers: {
    type: Number,
    default: 0
  },
  averagePlayers: {
    type: Number,
    default: 0
  },
  
  // Review stats
  reviewCount: {
    type: Number,
    default: 0
  },
  averageReviewScore: {
    type: Number,
    default: 0
  },
  
  // Tracking
  featured: {
    type: Boolean,
    default: false
  },
  trending: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastPlayerCountUpdate: Date,
  lastMetadataUpdate: Date,
  
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

// Indexes for queries
gameSchema.index({ name: 'text', description: 'text' });
gameSchema.index({ featured: 1, trending: 1 });
gameSchema.index({ currentPlayers: -1 });
gameSchema.index({ rating: -1 });
gameSchema.index({ genres: 1 });
gameSchema.index({ tags: 1 });

// Virtual for player count history
gameSchema.virtual('playerCountHistory', {
  ref: 'SteamPlayerCount',
  localField: '_id',
  foreignField: 'game'
});

module.exports = mongoose.model('Game', gameSchema);
