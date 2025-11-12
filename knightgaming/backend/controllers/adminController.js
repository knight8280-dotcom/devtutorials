/**
 * Admin Controller
 * Administrative functions for managing the platform
 */

const User = require('../models/User');
const Game = require('../models/Game');
const Review = require('../models/Review');
const LeaderboardEntry = require('../models/LeaderboardEntry');
const NewsArticle = require('../models/NewsArticle');
const StripeWebhookEvent = require('../models/StripeWebhookEvent');
const { cacheFlush } = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Get dashboard stats
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      premiumUsers,
      totalGames,
      totalReviews,
      totalNews,
      pendingReviews,
      flaggedReviews,
      pendingLeaderboard
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ 'subscription.status': 'active' }),
      Game.countDocuments({ isActive: true }),
      Review.countDocuments(),
      NewsArticle.countDocuments({ status: 'published' }),
      Review.countDocuments({ status: 'pending' }),
      Review.countDocuments({ status: 'flagged' }),
      LeaderboardEntry.countDocuments({ status: 'pending' })
    ]);

    // Recent users (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          premium: premiumUsers,
          recentSignups: recentUsers
        },
        content: {
          games: totalGames,
          reviews: totalReviews,
          news: totalNews
        },
        moderation: {
          pendingReviews,
          flaggedReviews,
          pendingLeaderboard
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users (with pagination)
 */
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, subscription } = req.query;

    const query = {};
    if (role) query.role = role;
    if (subscription) query['subscription.status'] = subscription;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -refreshTokens')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user role
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'admin', 'moderator'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    logger.info(`User ${userId} role updated to ${role} by admin ${req.userId}`);

    res.json({
      success: true,
      message: 'User role updated',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending reviews
 */
const getPendingReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
      Review.find({ status: 'pending' })
        .populate('user', 'username email')
        .populate('game', 'name slug')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit)),
      Review.countDocuments({ status: 'pending' })
    ]);

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Moderate review
 */
const moderateReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { status, notes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.status = status;
    review.moderationNotes = notes;
    review.moderatedBy = req.userId;
    review.moderatedAt = new Date();
    await review.save();

    logger.info(`Review ${reviewId} ${status} by admin ${req.userId}`);

    res.json({
      success: true,
      message: `Review ${status}`,
      data: { review }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending leaderboard entries
 */
const getPendingLeaderboard = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [entries, total] = await Promise.all([
      LeaderboardEntry.find({ 
        status: { $in: ['pending', 'flagged'] }
      })
        .populate('user', 'username email')
        .populate('game', 'name slug')
        .sort('-submittedAt')
        .skip(skip)
        .limit(parseInt(limit)),
      LeaderboardEntry.countDocuments({ 
        status: { $in: ['pending', 'flagged'] }
      })
    ]);

    res.json({
      success: true,
      data: {
        entries,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify leaderboard entry
 */
const verifyLeaderboardEntry = async (req, res, next) => {
  try {
    const { entryId } = req.params;
    const { status, reason } = req.body;

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const entry = await LeaderboardEntry.findById(entryId);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found'
      });
    }

    entry.status = status;
    if (status === 'rejected') {
      entry.rejectionReason = reason;
    }
    entry.verifiedBy = req.userId;
    entry.verifiedAt = new Date();
    await entry.save();

    logger.info(`Leaderboard entry ${entryId} ${status} by admin ${req.userId}`);

    res.json({
      success: true,
      message: `Entry ${status}`,
      data: { entry }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create news article (manual)
 */
const createNews = async (req, res, next) => {
  try {
    const {
      title,
      slug,
      summary,
      content,
      category,
      featuredImage,
      images,
      tags,
      games,
      isPremium,
      metaDescription,
      metaKeywords
    } = req.body;

    const article = await NewsArticle.create({
      title,
      slug,
      summary,
      content,
      category,
      featuredImage,
      images,
      tags,
      games,
      isPremium,
      metaDescription,
      metaKeywords,
      authorId: req.userId,
      sourceType: 'manual',
      status: 'published'
    });

    logger.info(`News article created by admin ${req.userId}: ${title}`);

    res.status(201).json({
      success: true,
      message: 'News article created',
      data: { article }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update news article
 */
const updateNews = async (req, res, next) => {
  try {
    const { articleId } = req.params;
    const updates = req.body;

    const article = await NewsArticle.findByIdAndUpdate(
      articleId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    logger.info(`News article ${articleId} updated by admin ${req.userId}`);

    res.json({
      success: true,
      message: 'Article updated',
      data: { article }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete news article
 */
const deleteNews = async (req, res, next) => {
  try {
    const { articleId } = req.params;

    const article = await NewsArticle.findByIdAndDelete(articleId);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    logger.info(`News article ${articleId} deleted by admin ${req.userId}`);

    res.json({
      success: true,
      message: 'Article deleted'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Stripe webhook logs
 */
const getWebhookLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, processed } = req.query;

    const query = {};
    if (processed !== undefined) {
      query.processed = processed === 'true';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      StripeWebhookEvent.find(query)
        .sort('-receivedAt')
        .skip(skip)
        .limit(parseInt(limit)),
      StripeWebhookEvent.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Flush cache
 */
const flushCache = async (req, res, next) => {
  try {
    await cacheFlush();

    logger.info(`Cache flushed by admin ${req.userId}`);

    res.json({
      success: true,
      message: 'Cache flushed successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getUsers,
  updateUserRole,
  getPendingReviews,
  moderateReview,
  getPendingLeaderboard,
  verifyLeaderboardEntry,
  createNews,
  updateNews,
  deleteNews,
  getWebhookLogs,
  flushCache
};
