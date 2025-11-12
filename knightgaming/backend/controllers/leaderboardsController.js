/**
 * Leaderboards Controller
 * Handle leaderboard entries and rankings
 */

const LeaderboardEntry = require('../models/LeaderboardEntry');
const Game = require('../models/Game');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Get leaderboard for a game
 */
const getLeaderboard = async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const { category = 'general', season, limit = 100, page = 1 } = req.query;

    const query = {
      game: gameId,
      category,
      status: 'verified',
      isActive: true
    };

    if (season) query.season = season;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [entries, total] = await Promise.all([
      LeaderboardEntry.find(query)
        .populate('user', 'username profile.avatar profile.displayName')
        .sort('-score')
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      LeaderboardEntry.countDocuments(query)
    ]);

    // Add ranks
    const startRank = skip + 1;
    entries.forEach((entry, index) => {
      entry.rank = startRank + index;
    });

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
 * Get user's leaderboard entries
 */
const getUserEntries = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [entries, total] = await Promise.all([
      LeaderboardEntry.find({ user: req.userId })
        .populate('game', 'name slug headerImage')
        .sort('-submittedAt')
        .skip(skip)
        .limit(parseInt(limit)),
      LeaderboardEntry.countDocuments({ user: req.userId })
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
 * Submit leaderboard entry
 */
const submitEntry = async (req, res, next) => {
  try {
    const {
      gameId,
      score,
      category = 'general',
      metadata,
      proof,
      achievedAt,
      season
    } = req.body;

    // Check if game exists
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    const user = await User.findById(req.userId);

    // Check for existing entry
    const existingEntry = await LeaderboardEntry.findOne({
      user: req.userId,
      game: gameId,
      category,
      season
    });

    let entry;

    if (existingEntry) {
      // Update if new score is better
      if (score > existingEntry.score) {
        existingEntry.score = score;
        existingEntry.metadata = metadata;
        existingEntry.proof = proof;
        existingEntry.achievedAt = achievedAt || new Date();
        existingEntry.status = 'pending'; // Re-verify
        
        // Run anti-cheat check
        const flagged = existingEntry.runAntiCheatCheck();
        if (flagged) {
          existingEntry.status = 'flagged';
        }

        await existingEntry.save();
        entry = existingEntry;
      } else {
        return res.status(400).json({
          success: false,
          message: 'New score must be higher than existing score'
        });
      }
    } else {
      // Create new entry
      entry = await LeaderboardEntry.create({
        game: gameId,
        user: req.userId,
        playerName: user.profile.displayName || user.username,
        score,
        category,
        metadata,
        proof,
        achievedAt: achievedAt || new Date(),
        season,
        status: 'pending'
      });

      // Run anti-cheat check
      const flagged = entry.runAntiCheatCheck();
      if (flagged) {
        entry.status = 'flagged';
        await entry.save();
      } else {
        // Auto-verify for now (implement admin approval later)
        entry.status = 'verified';
        await entry.save();
      }

      // Update user stats
      await User.findByIdAndUpdate(req.userId, {
        $inc: { 'stats.leaderboardEntries': 1 }
      });
    }

    logger.info(`Leaderboard entry submitted by user ${req.userId} for game ${gameId}`);

    res.status(201).json({
      success: true,
      message: entry.status === 'flagged' 
        ? 'Entry submitted but flagged for review' 
        : 'Entry submitted successfully',
      data: { entry }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's rank for a game
 */
const getUserRank = async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const { category = 'general', season } = req.query;

    const query = {
      game: gameId,
      category,
      status: 'verified',
      isActive: true
    };

    if (season) query.season = season;

    const userEntry = await LeaderboardEntry.findOne({
      ...query,
      user: req.userId
    });

    if (!userEntry) {
      return res.json({
        success: true,
        data: {
          hasEntry: false,
          rank: null,
          score: null
        }
      });
    }

    // Count entries with higher scores
    const rank = await LeaderboardEntry.countDocuments({
      ...query,
      score: { $gt: userEntry.score }
    }) + 1;

    res.json({
      success: true,
      data: {
        hasEntry: true,
        rank,
        score: userEntry.score,
        entry: userEntry
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get categories for a game
 */
const getCategories = async (req, res, next) => {
  try {
    const { gameId } = req.params;

    const categories = await LeaderboardEntry.distinct('category', {
      game: gameId,
      status: 'verified'
    });

    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete leaderboard entry (user or admin)
 */
const deleteEntry = async (req, res, next) => {
  try {
    const { id } = req.params;

    const entry = await LeaderboardEntry.findById(id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found'
      });
    }

    // Check ownership or admin
    if (entry.user.toString() !== req.userId.toString() && req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own entries'
      });
    }

    await LeaderboardEntry.findByIdAndDelete(id);

    logger.info(`Leaderboard entry ${id} deleted`);

    res.json({
      success: true,
      message: 'Entry deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLeaderboard,
  getUserEntries,
  submitEntry,
  getUserRank,
  getCategories,
  deleteEntry
};
