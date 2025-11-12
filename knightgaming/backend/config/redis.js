/**
 * Redis Configuration
 * Caching layer for API responses and session data
 */

const Redis = require('ioredis');
const logger = require('../utils/logger');

let redisClient = null;
const REDIS_ENABLED = process.env.REDIS_ENABLED === 'true';

const connectRedis = () => {
  if (!REDIS_ENABLED) {
    logger.info('Redis is disabled');
    return null;
  }

  try {
    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.error('Redis connection failed after 3 retries');
          return null;
        }
        return Math.min(times * 50, 2000);
      }
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected');
    });

    redisClient.on('error', (err) => {
      logger.error('Redis error:', err);
    });

    redisClient.on('close', () => {
      logger.warn('Redis connection closed');
    });

    return redisClient;
  } catch (error) {
    logger.error('Error connecting to Redis:', error);
    return null;
  }
};

const getRedisClient = () => {
  return redisClient;
};

const cacheGet = async (key) => {
  if (!redisClient) return null;
  
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error(`Redis GET error for key ${key}:`, error);
    return null;
  }
};

const cacheSet = async (key, value, ttlSeconds = 3600) => {
  if (!redisClient) return false;
  
  try {
    await redisClient.setex(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    logger.error(`Redis SET error for key ${key}:`, error);
    return false;
  }
};

const cacheDel = async (key) => {
  if (!redisClient) return false;
  
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    logger.error(`Redis DEL error for key ${key}:`, error);
    return false;
  }
};

const cacheFlush = async () => {
  if (!redisClient) return false;
  
  try {
    await redisClient.flushall();
    logger.info('Redis cache flushed');
    return true;
  } catch (error) {
    logger.error('Redis FLUSH error:', error);
    return false;
  }
};

const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    logger.info('Redis connection closed');
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  cacheGet,
  cacheSet,
  cacheDel,
  cacheFlush,
  closeRedis
};
