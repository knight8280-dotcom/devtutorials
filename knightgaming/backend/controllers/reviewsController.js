/**
 * Reviews Controller
 * Handle user game reviews
 */

const Review = require('../models/Review');
const Game = require('../models/Game');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Get reviews for a game
 */
const getGameReviews = async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const { page = 1, limit = 10, sort = '-createdAt', status = 'approved' } = req.query;

    const query = { 
      game: gameId,
      status: req.user && req.user.role === 'admin' ? undefined : status
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('user', 'username profile.avatar')
        .populate('game', 'name slug')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Review.countDocuments(query)
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
 * Get user's reviews
 */
const getUserReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
      Review.find({ user: req.userId })
        .populate('game', 'name slug headerImage')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit)),
      Review.countDocuments({ user: req.userId })
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
 * Get single review
 */
const getReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id)
      .populate('user', 'username profile.avatar profile.displayName')
      .populate('game', 'name slug headerImage');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      data: { review }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create review
 */
const createReview = async (req, res, next) => {
  try {
    const { gameId, rating, title, content, tags, hoursPlayed, recommendGame } = req.body;

    // Check if game exists
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    // Check if user already reviewed this game
    const existingReview = await Review.findOne({
      game: gameId,
      user: req.userId
    });

    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: 'You have already reviewed this game'
      });
    }

    // Create review
    const review = await Review.create({
      game: gameId,
      user: req.userId,
      rating,
      title,
      content,
      tags,
      hoursPlayed,
      recommendGame,
      status: 'approved' // Auto-approve for now, implement moderation later
    });

    // Update game review stats
    const reviews = await Review.find({ game: gameId, status: 'approved' });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    
    await Game.findByIdAndUpdate(gameId, {
      reviewCount: reviews.length,
      averageReviewScore: avgRating
    });

    // Update user stats
    await User.findByIdAndUpdate(req.userId, {
      $inc: { 'stats.reviewsWritten': 1 }
    });

    const populatedReview = await Review.findById(review._id)
      .populate('user', 'username profile.avatar')
      .populate('game', 'name slug');

    logger.info(`New review created by user ${req.userId} for game ${gameId}`);

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: { review: populatedReview }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update review
 */
const updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, title, content, tags, hoursPlayed, recommendGame } = req.body;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check ownership
    if (review.user.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own reviews'
      });
    }

    // Update fields
    if (rating !== undefined) review.rating = rating;
    if (title !== undefined) review.title = title;
    if (content !== undefined) review.content = content;
    if (tags !== undefined) review.tags = tags;
    if (hoursPlayed !== undefined) review.hoursPlayed = hoursPlayed;
    if (recommendGame !== undefined) review.recommendGame = recommendGame;

    review.edited = true;
    review.editedAt = new Date();
    review.status = 'pending'; // Re-moderate after edit

    await review.save();

    logger.info(`Review ${id} updated by user ${req.userId}`);

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: { review }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete review
 */
const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check ownership or admin
    if (review.user.toString() !== req.userId.toString() && req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own reviews'
      });
    }

    await Review.findByIdAndDelete(id);

    // Update game stats
    const reviews = await Review.find({ game: review.game, status: 'approved' });
    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;
    
    await Game.findByIdAndUpdate(review.game, {
      reviewCount: reviews.length,
      averageReviewScore: avgRating
    });

    logger.info(`Review ${id} deleted`);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Vote on review helpfulness
 */
const voteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isHelpful } = req.body;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user already voted
    const existingVote = review.helpfulVotes.find(
      v => v.user.toString() === req.userId.toString()
    );

    if (existingVote) {
      // Update existing vote
      existingVote.isHelpful = isHelpful;
    } else {
      // Add new vote
      review.helpfulVotes.push({
        user: req.userId,
        isHelpful
      });
    }

    // Recalculate counts
    review.helpfulCount = review.helpfulVotes.filter(v => v.isHelpful).length;
    review.notHelpfulCount = review.helpfulVotes.filter(v => !v.isHelpful).length;

    await review.save();

    res.json({
      success: true,
      message: 'Vote recorded',
      data: {
        helpfulCount: review.helpfulCount,
        notHelpfulCount: review.notHelpfulCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Flag review as inappropriate
 */
const flagReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user already flagged
    const alreadyFlagged = review.flags.some(
      f => f.user.toString() === req.userId.toString()
    );

    if (alreadyFlagged) {
      return res.status(409).json({
        success: false,
        message: 'You have already flagged this review'
      });
    }

    review.flags.push({
      user: req.userId,
      reason
    });

    // Auto-flag for moderation if multiple flags
    if (review.flags.length >= 3 && review.status !== 'flagged') {
      review.status = 'flagged';
      logger.warn(`Review ${id} auto-flagged after ${review.flags.length} reports`);
    }

    await review.save();

    res.json({
      success: true,
      message: 'Review flagged for moderation'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGameReviews,
  getUserReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
  voteReview,
  flagReview
};
