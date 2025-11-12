/**
 * Authentication Controller
 * Handle user registration, login, and token management
 */

const User = require('../models/User');
const { generateTokenPair, verifyRefreshToken } = require('../utils/jwt');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/email');
const logger = require('../utils/logger');
const crypto = require('crypto');

/**
 * Register new user
 */
const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: existingUser.email === email ? 
          'Email already registered' : 
          'Username already taken'
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      verificationToken: crypto.randomBytes(32).toString('hex')
    });

    // Generate tokens
    const tokens = generateTokenPair(user._id, user.role);

    // Store refresh token
    user.refreshTokens.push({
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    await user.save();

    // Send welcome email
    await sendWelcomeEmail(user);

    logger.info(`New user registered: ${username}`);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          subscription: user.subscription
        },
        tokens
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate tokens
    const tokens = generateTokenPair(user._id, user.role);

    // Store refresh token
    user.refreshTokens.push({
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    
    // Clean up old refresh tokens
    user.refreshTokens = user.refreshTokens.filter(rt => rt.expiresAt > new Date());
    
    user.lastLogin = new Date();
    await user.save();

    logger.info(`User logged in: ${user.username}`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          subscription: user.subscription,
          profile: user.profile,
          preferences: user.preferences
        },
        tokens
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Find user and check if refresh token exists
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    const tokenExists = user.refreshTokens.some(rt => 
      rt.token === refreshToken && rt.expiresAt > new Date()
    );

    if (!tokenExists) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    // Generate new access token
    const tokens = generateTokenPair(user._id, user.role);

    // Replace old refresh token with new one
    user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== refreshToken);
    user.refreshTokens.push({
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    await user.save();

    res.json({
      success: true,
      data: { tokens }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 */
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Remove refresh token from database
      await User.findByIdAndUpdate(req.userId, {
        $pull: { refreshTokens: { token: refreshToken } }
      });
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId)
      .populate('profile.favoriteGames', 'name slug headerImage');

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { displayName, bio, avatar, favoriteGames } = req.body;

    const updates = {};
    if (displayName !== undefined) updates['profile.displayName'] = displayName;
    if (bio !== undefined) updates['profile.bio'] = bio;
    if (avatar !== undefined) updates['profile.avatar'] = avatar;
    if (favoriteGames !== undefined) updates['profile.favoriteGames'] = favoriteGames;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user preferences
 */
const updatePreferences = async (req, res, next) => {
  try {
    const { theme, emailNotifications, newsAlerts, pollingInterval } = req.body;

    const updates = {};
    if (theme !== undefined) updates['preferences.theme'] = theme;
    if (emailNotifications !== undefined) updates['preferences.emailNotifications'] = emailNotifications;
    if (newsAlerts !== undefined) updates['preferences.newsAlerts'] = newsAlerts;
    if (pollingInterval !== undefined) updates['preferences.pollingInterval'] = pollingInterval;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: { preferences: user.preferences }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset
 */
const requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists
      return res.json({
        success: true,
        message: 'If the email exists, a reset link will be sent'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send email
    await sendPasswordResetEmail(user, resetToken);

    res.json({
      success: true,
      message: 'If the email exists, a reset link will be sent'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    }).select('+password');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    logger.info(`Password reset for user: ${user.username}`);

    res.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user account (GDPR compliance)
 */
const deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;

    const user = await User.findById(req.userId).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Delete user (consider soft delete in production)
    await User.findByIdAndDelete(req.userId);

    logger.info(`User account deleted: ${user.username}`);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  updatePreferences,
  requestPasswordReset,
  resetPassword,
  deleteAccount
};
