/**
 * News Controller
 * Handle gaming news articles
 */

const NewsArticle = require('../models/NewsArticle');
const { cacheGet, cacheSet } = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Get all news articles
 */
const getNews = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      tag,
      gameId,
      search,
      isPremium
    } = req.query;

    const query = { status: 'published' };

    // Apply filters
    if (category) query.category = category;
    if (tag) query.tags = tag;
    if (gameId) query.games = gameId;
    if (search) {
      query.$text = { $search: search };
    }

    // Premium filter for non-premium users
    if (!req.user || !req.user.isPremium()) {
      query.isPremium = false;
    } else if (isPremium === 'true') {
      query.isPremium = true;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [articles, total] = await Promise.all([
      NewsArticle.find(query)
        .populate('games', 'name slug headerImage')
        .populate('authorId', 'username profile.displayName')
        .sort('-publishedAt')
        .skip(skip)
        .limit(parseInt(limit))
        .select('-__v'),
      NewsArticle.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        articles,
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
 * Get single news article
 */
const getArticle = async (req, res, next) => {
  try {
    const { id } = req.params;

    const article = await NewsArticle.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { slug: id }
      ],
      status: 'published'
    })
      .populate('games', 'name slug headerImage')
      .populate('authorId', 'username profile.displayName profile.avatar');

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    // Check premium access
    if (article.isPremium && (!req.user || !req.user.isPremium())) {
      return res.status(403).json({
        success: false,
        message: 'Premium subscription required',
        code: 'PREMIUM_REQUIRED'
      });
    }

    // Increment views (async, don't await)
    article.incrementViews().catch(err => 
      logger.error('Error incrementing article views:', err)
    );

    res.json({
      success: true,
      data: { article }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get latest headlines
 */
const getHeadlines = async (req, res, next) => {
  try {
    const { limit = 5 } = req.query;

    const cacheKey = `headlines:${limit}`;
    const cached = await cacheGet(cacheKey);

    if (cached) {
      return res.json({
        success: true,
        data: { articles: cached }
      });
    }

    const articles = await NewsArticle.find({
      status: 'published',
      isPremium: false
    })
      .sort('-publishedAt')
      .limit(parseInt(limit))
      .select('title slug featuredImage publishedAt category');

    await cacheSet(cacheKey, articles, 300); // Cache for 5 minutes

    res.json({
      success: true,
      data: { articles }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get trending news
 */
const getTrendingNews = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const articles = await NewsArticle.find({
      status: 'published',
      isPremium: false,
      publishedAt: {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      }
    })
      .sort('-views -shares')
      .limit(parseInt(limit))
      .select('title slug featuredImage views shares publishedAt');

    res.json({
      success: true,
      data: { articles }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get news by game
 */
const getGameNews = async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const { limit = 10 } = req.query;

    const articles = await NewsArticle.find({
      status: 'published',
      games: gameId,
      isPremium: false
    })
      .sort('-publishedAt')
      .limit(parseInt(limit))
      .select('title slug summary featuredImage publishedAt category');

    res.json({
      success: true,
      data: { articles }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all categories
 */
const getCategories = async (req, res, next) => {
  try {
    const categories = [
      'news',
      'review',
      'guide',
      'announcement',
      'patch-notes',
      'industry',
      'esports'
    ];

    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all tags
 */
const getTags = async (req, res, next) => {
  try {
    const tags = await NewsArticle.distinct('tags', {
      status: 'published'
    });

    res.json({
      success: true,
      data: { tags: tags.sort() }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Like article
 */
const likeArticle = async (req, res, next) => {
  try {
    const { id } = req.params;

    const article = await NewsArticle.findByIdAndUpdate(
      id,
      { $inc: { likes: 1 } },
      { new: true }
    );

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    res.json({
      success: true,
      data: { likes: article.likes }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Share article (track)
 */
const shareArticle = async (req, res, next) => {
  try {
    const { id } = req.params;

    const article = await NewsArticle.findByIdAndUpdate(
      id,
      { $inc: { shares: 1 } },
      { new: true }
    );

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    res.json({
      success: true,
      data: { shares: article.shares }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNews,
  getArticle,
  getHeadlines,
  getTrendingNews,
  getGameNews,
  getCategories,
  getTags,
  likeArticle,
  shareArticle
};
