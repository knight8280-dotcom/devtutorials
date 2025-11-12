/**
 * Update Player Counts Worker
 * Fetches current player counts from Steam for all tracked games
 * Run frequency: Every 1-5 minutes (configurable)
 */

require('dotenv').config();
const { connectDB, closeDB } = require('../config/database');
const { connectRedis } = require('../config/redis');
const Game = require('../models/Game');
const SteamPlayerCount = require('../models/SteamPlayerCount');
const { getCurrentPlayerCount } = require('../services/steamService');
const logger = require('../utils/logger');

const updatePlayerCounts = async () => {
  try {
    logger.info('Starting player count update...');

    // Get all active games with Steam App IDs
    const games = await Game.find({
      isActive: true,
      steamAppId: { $exists: true, $ne: null }
    }).select('_id name steamAppId currentPlayers peakPlayers');

    logger.info(`Found ${games.length} games to update`);

    let updated = 0;
    let failed = 0;

    // Update player counts
    for (const game of games) {
      try {
        const playerCount = await getCurrentPlayerCount(game.steamAppId);

        if (playerCount !== null) {
          // Save to time series
          await SteamPlayerCount.create({
            game: game._id,
            steamAppId: game.steamAppId,
            playerCount,
            timestamp: new Date()
          });

          // Update game record
          const updates = {
            currentPlayers: playerCount,
            lastPlayerCountUpdate: new Date()
          };

          // Update peak if necessary
          if (playerCount > game.peakPlayers) {
            updates.peakPlayers = playerCount;
          }

          // Calculate 24h average
          const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
          const recentCounts = await SteamPlayerCount.find({
            game: game._id,
            timestamp: { $gte: yesterday }
          });

          if (recentCounts.length > 0) {
            const avgPlayers = Math.round(
              recentCounts.reduce((sum, pc) => sum + pc.playerCount, 0) / recentCounts.length
            );
            updates.averagePlayers = avgPlayers;
          }

          await Game.findByIdAndUpdate(game._id, updates);

          updated++;
        } else {
          failed++;
          logger.warn(`Failed to get player count for ${game.name} (${game.steamAppId})`);
        }

        // Rate limiting - delay between requests
        await new Promise(resolve => setTimeout(resolve, 300));

      } catch (error) {
        failed++;
        logger.error(`Error updating ${game.name}:`, error.message);
      }
    }

    logger.info(`Player count update complete: ${updated} updated, ${failed} failed`);

  } catch (error) {
    logger.error('Error in updatePlayerCounts:', error);
    throw error;
  }
};

// Run as standalone script
if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      if (process.env.REDIS_ENABLED === 'true') {
        connectRedis();
      }

      await updatePlayerCounts();

      await closeDB();
      process.exit(0);
    } catch (error) {
      logger.error('Worker error:', error);
      process.exit(1);
    }
  })();
}

module.exports = { updatePlayerCounts };
