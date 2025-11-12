/**
 * AI Controller
 * Handle AI-powered content generation
 */

const {
  generateSummary,
  generateTrendHighlight,
  generateSocialSuggestions,
  getCachedSummary,
  getUsageStats
} = require('../services/openaiService');
const NewsArticle = require('../models/NewsArticle');
const Game = require('../models/Game');
const SteamPlayerCount = require('../models/SteamPlayerCount');
const logger = require('../utils/logger');

/**
 * Generate summary from text
 */
const summarizeText = async (req, res, next) => {
  try {
    const { text, maxWords = 120, contentType = 'general', contentId = '' } = req.body;

    if (!text || text.length < 50) {
      return res.status(400).json({
        success: false,
        message: 'Text must be at least 50 characters'
      });
    }

    const result = await generateSummary(text, maxWords, contentType, contentId);

    if (!result.moderationPassed) {
      logger.warn(`AI summary failed moderation for user ${req.userId}`);
      return res.status(400).json({
        success: false,
        message: 'Generated content failed moderation checks'
      });
    }

    res.json({
      success: true,
      data: {
        summary: result.summary,
        cached: result.cached,
        tokensUsed: result.tokensUsed
      }
    });
  } catch (error) {
    logger.error('Error in summarizeText:', error);
    next(error);
  }
};

/**
 * Get cached summary for an article
 */
const getArticleSummary = async (req, res, next) => {
  try {
    const { articleId } = req.params;

    const article = await NewsArticle.findById(articleId);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    // Check if AI summary already exists
    if (article.aiSummary.generated && article.aiSummary.content) {
      return res.json({
        success: true,
        data: {
          summary: article.aiSummary.content,
          cached: true,
          generatedAt: article.aiSummary.generatedAt
        }
      });
    }

    // Generate new summary
    const result = await generateSummary(
      article.content,
      120,
      'news',
      articleId
    );

    // Store in article
    article.aiSummary = {
      generated: true,
      content: result.summary,
      generatedAt: new Date(),
      model: 'gpt-3.5-turbo'
    };
    await article.save();

    res.json({
      success: true,
      data: {
        summary: result.summary,
        cached: false,
        tokensUsed: result.tokensUsed
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate trend highlight for a game
 */
const highlightTrend = async (req, res, next) => {
  try {
    const { gameId } = req.body;
    const { timeRange = '48h' } = req.query;

    const game = await Game.findById(gameId);

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    // Calculate time range
    let hours;
    switch (timeRange) {
      case '24h': hours = 24; break;
      case '48h': hours = 48; break;
      case '7d': hours = 168; break;
      case '30d': hours = 720; break;
      default: hours = 48;
    }

    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Fetch player count data
    const playerCounts = await SteamPlayerCount.find({
      game: gameId,
      timestamp: { $gte: startTime }
    })
      .sort('timestamp')
      .limit(100);

    if (playerCounts.length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient data to analyze trends'
      });
    }

    // Prepare data for AI
    const playerData = playerCounts.map(pc => ({
      date: pc.timestamp.toISOString(),
      count: pc.playerCount
    }));

    const result = await generateTrendHighlight(game.name, playerData);

    res.json({
      success: true,
      data: {
        gameName: game.name,
        timeRange,
        highlight: result.highlight,
        cached: result.cached,
        tokensUsed: result.tokensUsed
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate social media post suggestions
 */
const suggestSocialPosts = async (req, res, next) => {
  try {
    const { content, platform = 'twitter', count = 3 } = req.body;

    if (!content || content.length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Content must be at least 20 characters'
      });
    }

    const result = await generateSocialSuggestions(content, platform, count);

    res.json({
      success: true,
      data: {
        platform,
        suggestions: result.suggestions,
        cached: result.cached,
        tokensUsed: result.tokensUsed
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get AI usage statistics (admin or self)
 */
const getStats = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;

    const stats = await getUsageStats(req.userId, parseInt(days));

    res.json({
      success: true,
      data: {
        period: `${days} days`,
        ...stats,
        costEstimate: `$${stats.totalCost.toFixed(4)}`
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  summarizeText,
  getArticleSummary,
  highlightTrend,
  suggestSocialPosts,
  getStats
};
