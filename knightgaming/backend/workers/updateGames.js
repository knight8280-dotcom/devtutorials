/**
 * Update Games Worker
 * Fetches and updates game metadata from RAWG and Steam
 * Run frequency: Daily
 */

require('dotenv').config();
const { connectDB, closeDB } = require('../config/database');
const { connectRedis } = require('../config/redis');
const Game = require('../models/Game');
const { getTrendingGames, getGameDetails, getGameScreenshots } = require('../services/rawgService');
const { getGameDetails: getSteamDetails } = require('../services/steamService');
const logger = require('../utils/logger');

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

const updateGames = async () => {
  try {
    logger.info('Starting games update...');

    // Fetch trending games from RAWG
    const trendingGames = await getTrendingGames(50);
    
    logger.info(`Found ${trendingGames.length} trending games from RAWG`);

    let created = 0;
    let updated = 0;
    let failed = 0;

    for (const rawgGame of trendingGames) {
      try {
        // Get full details
        const details = await getGameDetails(rawgGame.id);
        
        if (!details) {
          failed++;
          continue;
        }

        const slug = slugify(details.name);

        // Check if game exists
        let game = await Game.findOne({ rawgId: details.id });

        const gameData = {
          rawgId: details.id,
          name: details.name,
          slug,
          description: details.description,
          shortDescription: details.description ? details.description.substring(0, 300) : '',
          headerImage: details.backgroundImage,
          backgroundImage: details.backgroundImageAdditional || details.backgroundImage,
          screenshots: await getGameScreenshots(details.id),
          releaseDate: details.released ? new Date(details.released) : null,
          genres: details.genres,
          tags: details.tags.slice(0, 10),
          platforms: details.platforms,
          developers: details.developers,
          publishers: details.publishers,
          rating: details.rating || 0,
          metacriticScore: details.metacritic,
          trending: true,
          lastMetadataUpdate: new Date()
        };

        if (game) {
          // Update existing
          await Game.findByIdAndUpdate(game._id, gameData);
          updated++;
        } else {
          // Create new
          await Game.create(gameData);
          created++;
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        failed++;
        logger.error(`Error processing game ${rawgGame.name}:`, error.message);
      }
    }

    // Update trending flag - mark old trending games as not trending
    await Game.updateMany(
      {
        trending: true,
        lastMetadataUpdate: {
          $lt: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      { trending: false }
    );

    logger.info(`Games update complete: ${created} created, ${updated} updated, ${failed} failed`);

  } catch (error) {
    logger.error('Error in updateGames:', error);
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

      await updateGames();

      await closeDB();
      process.exit(0);
    } catch (error) {
      logger.error('Worker error:', error);
      process.exit(1);
    }
  })();
}

module.exports = { updateGames };
