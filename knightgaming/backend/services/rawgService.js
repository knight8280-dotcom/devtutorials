/**
 * RAWG API Service
 * Fetch game metadata from RAWG.io
 */

const axios = require('axios');
const logger = require('../utils/logger');
const { cacheGet, cacheSet } = require('../config/redis');

const RAWG_API_BASE = 'https://api.rawg.io/api';
const RAWG_API_KEY = process.env.RAWG_API_KEY;

/**
 * Search for games
 */
const searchGames = async (query, page = 1, pageSize = 20) => {
  const cacheKey = `rawg:search:${query}:${page}:${pageSize}`;
  
  // Check cache (1 hour TTL)
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${RAWG_API_BASE}/games`, {
      params: {
        key: RAWG_API_KEY,
        search: query,
        page,
        page_size: pageSize
      },
      timeout: 10000
    });

    const results = {
      count: response.data.count,
      next: response.data.next,
      results: response.data.results.map(game => ({
        id: game.id,
        slug: game.slug,
        name: game.name,
        released: game.released,
        backgroundImage: game.background_image,
        rating: game.rating,
        ratingsCount: game.ratings_count,
        metacritic: game.metacritic,
        platforms: game.platforms ? game.platforms.map(p => p.platform.name) : [],
        genres: game.genres ? game.genres.map(g => g.name) : [],
        tags: game.tags ? game.tags.slice(0, 5).map(t => t.name) : []
      }))
    };

    await cacheSet(cacheKey, results, 3600); // Cache for 1 hour
    return results;
  } catch (error) {
    logger.error('Error searching RAWG games:', error.message);
    return { count: 0, results: [] };
  }
};

/**
 * Get game details by ID
 */
const getGameDetails = async (gameId) => {
  const cacheKey = `rawg:game:${gameId}`;
  
  // Check cache (24 hour TTL)
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${RAWG_API_BASE}/games/${gameId}`, {
      params: { key: RAWG_API_KEY },
      timeout: 10000
    });

    const game = response.data;
    const details = {
      id: game.id,
      slug: game.slug,
      name: game.name,
      description: game.description_raw,
      released: game.released,
      backgroundImage: game.background_image,
      backgroundImageAdditional: game.background_image_additional,
      rating: game.rating,
      ratingTop: game.rating_top,
      ratingsCount: game.ratings_count,
      metacritic: game.metacritic,
      playtime: game.playtime,
      platforms: game.platforms ? game.platforms.map(p => p.platform.name) : [],
      developers: game.developers ? game.developers.map(d => d.name) : [],
      publishers: game.publishers ? game.publishers.map(p => p.name) : [],
      genres: game.genres ? game.genres.map(g => g.name) : [],
      tags: game.tags ? game.tags.map(t => t.name) : [],
      esrbRating: game.esrb_rating?.name,
      website: game.website,
      reddit: game.reddit_url,
      screenshots: []
    };

    await cacheSet(cacheKey, details, 86400); // Cache for 24 hours
    return details;
  } catch (error) {
    logger.error(`Error fetching RAWG game details for ID ${gameId}:`, error.message);
    return null;
  }
};

/**
 * Get game screenshots
 */
const getGameScreenshots = async (gameId) => {
  const cacheKey = `rawg:screenshots:${gameId}`;
  
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${RAWG_API_BASE}/games/${gameId}/screenshots`, {
      params: { key: RAWG_API_KEY },
      timeout: 10000
    });

    const screenshots = response.data.results.map(s => s.image);
    await cacheSet(cacheKey, screenshots, 86400);
    return screenshots;
  } catch (error) {
    logger.error(`Error fetching RAWG screenshots for game ${gameId}:`, error.message);
    return [];
  }
};

/**
 * Get trending games
 */
const getTrendingGames = async (pageSize = 20) => {
  const cacheKey = `rawg:trending:${pageSize}`;
  
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  try {
    const today = new Date();
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const response = await axios.get(`${RAWG_API_BASE}/games`, {
      params: {
        key: RAWG_API_KEY,
        dates: `${lastMonth.toISOString().split('T')[0]},${today.toISOString().split('T')[0]}`,
        ordering: '-added',
        page_size: pageSize
      },
      timeout: 10000
    });

    const games = response.data.results.map(game => ({
      id: game.id,
      slug: game.slug,
      name: game.name,
      released: game.released,
      backgroundImage: game.background_image,
      rating: game.rating,
      metacritic: game.metacritic
    }));

    await cacheSet(cacheKey, games, 3600); // Cache for 1 hour
    return games;
  } catch (error) {
    logger.error('Error fetching trending games from RAWG:', error.message);
    return [];
  }
};

/**
 * Get upcoming games
 */
const getUpcomingGames = async (pageSize = 20) => {
  const cacheKey = `rawg:upcoming:${pageSize}`;
  
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  try {
    const today = new Date();
    const nextMonth = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
    
    const response = await axios.get(`${RAWG_API_BASE}/games`, {
      params: {
        key: RAWG_API_KEY,
        dates: `${today.toISOString().split('T')[0]},${nextMonth.toISOString().split('T')[0]}`,
        ordering: 'released',
        page_size: pageSize
      },
      timeout: 10000
    });

    const games = response.data.results.map(game => ({
      id: game.id,
      slug: game.slug,
      name: game.name,
      released: game.released,
      backgroundImage: game.background_image,
      rating: game.rating
    }));

    await cacheSet(cacheKey, games, 7200); // Cache for 2 hours
    return games;
  } catch (error) {
    logger.error('Error fetching upcoming games from RAWG:', error.message);
    return [];
  }
};

module.exports = {
  searchGames,
  getGameDetails,
  getGameScreenshots,
  getTrendingGames,
  getUpcomingGames
};
