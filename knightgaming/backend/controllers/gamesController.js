/**
 * Games Controller
 * Handle game data, search, and player counts
 */

const Game = require('../models/Game');
const SteamPlayerCount = require('../models/SteamPlayerCount');
const { cacheGet, cacheSet } = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Get all games with pagination and filters
 */
const getGames = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      sort = '-currentPlayers',
      genre,
      platform,
      featured,
      trending,
      search
    } = req.query;

    const query = { isActive: true };

    // Apply filters
    if (genre) query.genres = genre;
    if (platform) query.platforms = platform;
    if (featured === 'true') query.featured = true;
    if (trending === 'true') query.trending = true;
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [games, total] = await Promise.all([
      Game.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-__v'),
      Game.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        games,
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
 * Get game by ID or slug
 */
const getGame = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Try finding by ID first, then by slug
    const game = await Game.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { slug: id }
      ]
    });

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    res.json({
      success: true,
      data: { game }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current player count for a game
 */
const getPlayerCount = async (req, res, next) => {
  try {
    const { id } = req.params;

    const game = await Game.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { slug: id }
      ]
    });

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    res.json({
      success: true,
      data: {
        gameId: game._id,
        gameName: game.name,
        currentPlayers: game.currentPlayers,
        peakPlayers: game.peakPlayers,
        averagePlayers: game.averagePlayers,
        lastUpdate: game.lastPlayerCountUpdate
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get player count history for a game
 */
const getPlayerCountHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { timeRange = '24h', interval = '1h' } = req.query;

    const game = await Game.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { slug: id }
      ]
    });

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    // Calculate time range
    const now = new Date();
    let startTime;
    
    switch (timeRange) {
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '48h':
        startTime = new Date(now.getTime() - 48 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Fetch player count history
    const history = await SteamPlayerCount.find({
      game: game._id,
      timestamp: { $gte: startTime }
    })
      .sort({ timestamp: 1 })
      .select('playerCount timestamp');

    res.json({
      success: true,
      data: {
        gameId: game._id,
        gameName: game.name,
        timeRange,
        history: history.map(h => ({
          timestamp: h.timestamp,
          playerCount: h.playerCount
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get trending games
 */
const getTrendingGames = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const games = await Game.find({ 
      isActive: true,
      trending: true 
    })
      .sort('-currentPlayers')
      .limit(parseInt(limit))
      .select('name slug headerImage currentPlayers peakPlayers genres rating');

    res.json({
      success: true,
      data: { games }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get featured games
 */
const getFeaturedGames = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const games = await Game.find({ 
      isActive: true,
      featured: true 
    })
      .sort('-rating')
      .limit(parseInt(limit))
      .select('name slug headerImage backgroundImage rating ratingsCount genres description');

    res.json({
      success: true,
      data: { games }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get game statistics
 */
const getGameStats = async (req, res, next) => {
  try {
    const { id } = req.params;

    const game = await Game.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { slug: id }
      ]
    });

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    // Calculate statistics from player count history
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const playerCounts = await SteamPlayerCount.find({
      game: game._id,
      timestamp: { $gte: last24h }
    });

    const stats = {
      current: game.currentPlayers,
      peak24h: Math.max(...playerCounts.map(p => p.playerCount), 0),
      average24h: playerCounts.length > 0 
        ? Math.round(playerCounts.reduce((sum, p) => sum + p.playerCount, 0) / playerCounts.length)
        : 0,
      allTimePeak: game.peakPlayers
    };

    // Premium users get detailed breakdown
    if (req.user && req.user.isPremium()) {
      const hourlyStats = {};
      playerCounts.forEach(pc => {
        const hour = pc.hour;
        if (!hourlyStats[hour]) {
          hourlyStats[hour] = { count: 0, total: 0 };
        }
        hourlyStats[hour].count++;
        hourlyStats[hour].total += pc.playerCount;
      });

      stats.hourlyAverage = Object.keys(hourlyStats).map(hour => ({
        hour: parseInt(hour),
        average: Math.round(hourlyStats[hour].total / hourlyStats[hour].count)
      })).sort((a, b) => a.hour - b.hour);
    }

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search games
 */
const searchGames = async (req, res, next) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const games = await Game.find({
      isActive: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ]
    })
      .limit(parseInt(limit))
      .select('name slug headerImage genres platforms');

    res.json({
      success: true,
      data: { games }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all genres
 */
const getGenres = async (req, res, next) => {
  try {
    const genres = await Game.distinct('genres', { isActive: true });

    res.json({
      success: true,
      data: { genres: genres.sort() }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all platforms
 */
const getPlatforms = async (req, res, next) => {
  try {
    const platforms = await Game.distinct('platforms', { isActive: true });

    res.json({
      success: true,
      data: { platforms: platforms.sort() }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGames,
  getGame,
  getPlayerCount,
  getPlayerCountHistory,
  getTrendingGames,
  getFeaturedGames,
  getGameStats,
  searchGames,
  getGenres,
  getPlatforms
};
