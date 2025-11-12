/**
 * Steam API Service
 * Fetch game data and player counts from Steam
 */

const axios = require('axios');
const logger = require('../utils/logger');
const { cacheGet, cacheSet } = require('../config/redis');

const STEAM_API_BASE = 'https://api.steampowered.com';
const STEAM_STORE_API = 'https://store.steampowered.com/api';

/**
 * Get current player count for a game
 */
const getCurrentPlayerCount = async (appId) => {
  const cacheKey = `steam:players:${appId}`;
  
  // Check cache first (1 minute TTL)
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  try {
    const url = `${STEAM_API_BASE}/ISteamUserStats/GetNumberOfCurrentPlayers/v1/`;
    const response = await axios.get(url, {
      params: { appid: appId },
      timeout: 5000
    });

    if (response.data.response.result === 1) {
      const playerCount = response.data.response.player_count;
      await cacheSet(cacheKey, playerCount, 60); // Cache for 1 minute
      return playerCount;
    }

    return null;
  } catch (error) {
    logger.error(`Error fetching Steam player count for app ${appId}:`, error.message);
    return null;
  }
};

/**
 * Get game details from Steam Store API
 */
const getGameDetails = async (appId) => {
  const cacheKey = `steam:details:${appId}`;
  
  // Check cache (24 hour TTL)
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  try {
    const url = `${STEAM_STORE_API}/appdetails`;
    const response = await axios.get(url, {
      params: {
        appids: appId,
        l: 'english'
      },
      timeout: 10000
    });

    const gameData = response.data[appId];
    
    if (gameData && gameData.success) {
      const data = gameData.data;
      const details = {
        name: data.name,
        type: data.type,
        description: data.short_description,
        fullDescription: data.detailed_description,
        about: data.about_the_game,
        headerImage: data.header_image,
        backgroundImage: data.background,
        screenshots: data.screenshots ? data.screenshots.map(s => s.path_full) : [],
        movies: data.movies ? data.movies.map(m => m.webm?.max || m.mp4?.max) : [],
        releaseDate: data.release_date?.date,
        developers: data.developers || [],
        publishers: data.publishers || [],
        genres: data.genres ? data.genres.map(g => g.description) : [],
        categories: data.categories ? data.categories.map(c => c.description) : [],
        platforms: {
          windows: data.platforms?.windows || false,
          mac: data.platforms?.mac || false,
          linux: data.platforms?.linux || false
        },
        metacriticScore: data.metacritic?.score,
        price: data.price_overview ? {
          currency: data.price_overview.currency,
          initial: data.price_overview.initial / 100,
          final: data.price_overview.final / 100,
          discount: data.price_overview.discount_percent
        } : null,
        isFree: data.is_free,
        achievements: data.achievements?.total || 0,
        recommendations: data.recommendations?.total || 0
      };

      await cacheSet(cacheKey, details, 86400); // Cache for 24 hours
      return details;
    }

    return null;
  } catch (error) {
    logger.error(`Error fetching Steam game details for app ${appId}:`, error.message);
    return null;
  }
};

/**
 * Get game reviews from Steam
 */
const getGameReviews = async (appId, limit = 20) => {
  const cacheKey = `steam:reviews:${appId}:${limit}`;
  
  // Check cache (1 hour TTL)
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  try {
    const url = `${STEAM_STORE_API}/appreviews/${appId}`;
    const response = await axios.get(url, {
      params: {
        json: 1,
        language: 'english',
        num_per_page: limit,
        filter: 'recent'
      },
      timeout: 10000
    });

    if (response.data.success === 1) {
      const reviews = response.data.reviews.map(review => ({
        author: review.author.steamid,
        playtime: review.author.playtime_forever,
        playtimeAtReview: review.author.playtime_at_review,
        recommend: review.voted_up,
        review: review.review,
        timestamp: review.timestamp_created,
        helpful: review.votes_up,
        funny: review.votes_funny
      }));

      await cacheSet(cacheKey, reviews, 3600); // Cache for 1 hour
      return reviews;
    }

    return [];
  } catch (error) {
    logger.error(`Error fetching Steam reviews for app ${appId}:`, error.message);
    return [];
  }
};

/**
 * Search for games on Steam (limited functionality, mainly for verification)
 */
const searchGames = async (query) => {
  try {
    // Note: Steam doesn't have an official search API, this is a workaround
    const url = `${STEAM_STORE_API}/storesearch/`;
    const response = await axios.get(url, {
      params: {
        term: query,
        l: 'english',
        cc: 'US'
      },
      timeout: 5000
    });

    if (response.data.items) {
      return response.data.items.slice(0, 10).map(item => ({
        appId: item.id,
        name: item.name,
        type: item.type,
        tiny_image: item.tiny_image,
        price: item.price?.final ? item.price.final / 100 : null
      }));
    }

    return [];
  } catch (error) {
    logger.error('Error searching Steam games:', error.message);
    return [];
  }
};

module.exports = {
  getCurrentPlayerCount,
  getGameDetails,
  getGameReviews,
  searchGames
};
