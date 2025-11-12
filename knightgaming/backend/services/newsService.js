/**
 * News API Service
 * Fetch gaming news from NewsAPI and other sources
 */

const axios = require('axios');
const logger = require('../utils/logger');
const { cacheGet, cacheSet } = require('../config/redis');

const NEWS_API_BASE = 'https://newsapi.org/v2';
const NEWS_API_KEY = process.env.NEWS_API_KEY;

/**
 * Fetch gaming news from NewsAPI
 */
const getGamingNews = async (page = 1, pageSize = 20) => {
  const cacheKey = `news:gaming:${page}:${pageSize}`;
  
  // Check cache (15 minute TTL)
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${NEWS_API_BASE}/everything`, {
      params: {
        apiKey: NEWS_API_KEY,
        q: 'gaming OR video games OR esports',
        language: 'en',
        sortBy: 'publishedAt',
        page,
        pageSize
      },
      timeout: 10000
    });

    const articles = response.data.articles.map(article => ({
      title: article.title,
      description: article.description,
      content: article.content,
      url: article.url,
      urlToImage: article.urlToImage,
      publishedAt: article.publishedAt,
      source: article.source.name,
      author: article.author
    }));

    const result = {
      totalResults: response.data.totalResults,
      articles
    };

    await cacheSet(cacheKey, result, 900); // Cache for 15 minutes
    return result;
  } catch (error) {
    logger.error('Error fetching gaming news:', error.message);
    return { totalResults: 0, articles: [] };
  }
};

/**
 * Search news by query
 */
const searchNews = async (query, page = 1, pageSize = 20) => {
  const cacheKey = `news:search:${query}:${page}:${pageSize}`;
  
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${NEWS_API_BASE}/everything`, {
      params: {
        apiKey: NEWS_API_KEY,
        q: query,
        language: 'en',
        sortBy: 'publishedAt',
        page,
        pageSize
      },
      timeout: 10000
    });

    const articles = response.data.articles.map(article => ({
      title: article.title,
      description: article.description,
      content: article.content,
      url: article.url,
      urlToImage: article.urlToImage,
      publishedAt: article.publishedAt,
      source: article.source.name,
      author: article.author
    }));

    const result = {
      totalResults: response.data.totalResults,
      articles
    };

    await cacheSet(cacheKey, result, 900);
    return result;
  } catch (error) {
    logger.error(`Error searching news for query "${query}":`, error.message);
    return { totalResults: 0, articles: [] };
  }
};

/**
 * Get top headlines for gaming
 */
const getTopHeadlines = async (pageSize = 10) => {
  const cacheKey = `news:headlines:${pageSize}`;
  
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${NEWS_API_BASE}/top-headlines`, {
      params: {
        apiKey: NEWS_API_KEY,
        category: 'technology',
        language: 'en',
        pageSize
      },
      timeout: 10000
    });

    // Filter for gaming-related headlines
    const articles = response.data.articles
      .filter(article => {
        const text = `${article.title} ${article.description}`.toLowerCase();
        return text.includes('game') || 
               text.includes('gaming') || 
               text.includes('esport') ||
               text.includes('playstation') ||
               text.includes('xbox') ||
               text.includes('nintendo');
      })
      .map(article => ({
        title: article.title,
        description: article.description,
        url: article.url,
        urlToImage: article.urlToImage,
        publishedAt: article.publishedAt,
        source: article.source.name
      }));

    await cacheSet(cacheKey, articles, 1800); // Cache for 30 minutes
    return articles;
  } catch (error) {
    logger.error('Error fetching top headlines:', error.message);
    return [];
  }
};

/**
 * Get news by specific game name
 */
const getGameNews = async (gameName, pageSize = 10) => {
  const cacheKey = `news:game:${gameName}:${pageSize}`;
  
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${NEWS_API_BASE}/everything`, {
      params: {
        apiKey: NEWS_API_KEY,
        q: gameName,
        language: 'en',
        sortBy: 'publishedAt',
        pageSize
      },
      timeout: 10000
    });

    const articles = response.data.articles.map(article => ({
      title: article.title,
      description: article.description,
      content: article.content,
      url: article.url,
      urlToImage: article.urlToImage,
      publishedAt: article.publishedAt,
      source: article.source.name,
      author: article.author
    }));

    await cacheSet(cacheKey, articles, 3600); // Cache for 1 hour
    return articles;
  } catch (error) {
    logger.error(`Error fetching news for game "${gameName}":`, error.message);
    return [];
  }
};

module.exports = {
  getGamingNews,
  searchNews,
  getTopHeadlines,
  getGameNews
};
