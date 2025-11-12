/**
 * User Model
 * Handles user accounts, authentication, roles, and subscription status
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username must be less than 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Don't return password by default
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  subscription: {
    status: {
      type: String,
      enum: ['none', 'active', 'cancelled', 'expired'],
      default: 'none'
    },
    tier: {
      type: String,
      enum: ['free', 'premium'],
      default: 'free'
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: Boolean
  },
  profile: {
    displayName: String,
    avatar: String,
    bio: {
      type: String,
      maxlength: [500, 'Bio must be less than 500 characters']
    },
    favoriteGames: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game'
    }]
  },
  preferences: {
    theme: {
      type: String,
      enum: ['dark', 'light'],
      default: 'dark'
    },
    emailNotifications: {
      type: Boolean,
      default: true
    },
    newsAlerts: {
      type: Boolean,
      default: false
    },
    pollingInterval: {
      type: Number,
      default: 60000, // 60 seconds
      min: 30000,
      max: 300000
    }
  },
  stats: {
    reviewsWritten: {
      type: Number,
      default: 0
    },
    leaderboardEntries: {
      type: Number,
      default: 0
    },
    lastActive: Date
  },
  verified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  refreshTokens: [{
    token: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: Date
  }],
  lastLogin: Date,
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

// Index for performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ 'subscription.stripeCustomerId': 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Method to check if user is premium
userSchema.methods.isPremium = function() {
  return this.subscription.tier === 'premium' && 
         this.subscription.status === 'active' &&
         (!this.subscription.currentPeriodEnd || this.subscription.currentPeriodEnd > new Date());
};

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.refreshTokens;
  delete user.verificationToken;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpires;
  return user;
};

module.exports = mongoose.model('User', userSchema);
