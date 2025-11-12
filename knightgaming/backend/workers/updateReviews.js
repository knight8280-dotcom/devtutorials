/**
 * Update Reviews Worker
 * Imports reviews from Steam for tracked games
 * Run frequency: Daily
 */

require('dotenv').config();
const { connectDB, closeDB } = require('../config/database');
const Game = require('../models/Game');
const Review = require('../models/Review');
const User = require('../models/User');
const { getGameReviews } = require('../services/steamService');
const logger = require('../utils/logger');

const updateReviews = async () => {
  try {
    logger.info('Starting reviews update...');

    // Get games with Steam App IDs that need review updates
    const games = await Game.find({
      isActive: true,
      steamAppId: { $exists: true, $ne: null },
      reviewCount: { $lt: 10 } // Only games with few reviews
    })
      .limit(20) // Limit to prevent API abuse
      .select('_id name steamAppId');

    logger.info(`Found ${games.length} games to import reviews for`);

    let imported = 0;
    let skipped = 0;

    // Create a system user for imported reviews
    let systemUser = await User.findOne({ email: 'system@knightgaming.internal' });
    if (!systemUser) {
      systemUser = await User.create({
        username: 'steamimport',
        email: 'system@knightgaming.internal',
        password: Math.random().toString(36).substring(2, 15),
        role: 'user',
        verified: true
      });
    }

    for (const game of games) {
      try {
        const steamReviews = await getGameReviews(game.steamAppId, 5);

        for (const steamReview of steamReviews) {
          try {
            // Check if review already imported
            const existing = await Review.findOne({
              game: game._id,
              steamReviewId: steamReview.author
            });

            if (existing) {
              skipped++;
              continue;
            }

            // Calculate rating from playtime and recommendation
            let rating = steamReview.recommend ? 4 : 2;
            if (steamReview.playtime > 1000 && steamReview.recommend) {
              rating = 5;
            } else if (steamReview.playtime > 500 && steamReview.recommend) {
              rating = 4;
            }

            // Create review
            await Review.create({
              game: game._id,
              user: systemUser._id,
              rating,
              title: steamReview.recommend ? 'Recommended' : 'Not Recommended',
              content: steamReview.review,
              hoursPlayed: Math.round(steamReview.playtime / 60),
              recommendGame: steamReview.recommend,
              importedFromSteam: true,
              steamReviewId: steamReview.author,
              status: 'approved'
            });

            imported++;

          } catch (error) {
            logger.error(`Error importing review:`, error.message);
          }
        }

        // Update game review count
        const reviewCount = await Review.countDocuments({
          game: game._id,
          status: 'approved'
        });

        const reviews = await Review.find({
          game: game._id,
          status: 'approved'
        });

        const avgRating = reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

        await Game.findByIdAndUpdate(game._id, {
          reviewCount,
          averageReviewScore: avgRating
        });

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        logger.error(`Error processing reviews for ${game.name}:`, error.message);
      }
    }

    logger.info(`Reviews update complete: ${imported} imported, ${skipped} skipped`);

  } catch (error) {
    logger.error('Error in updateReviews:', error);
    throw error;
  }
};

// Run as standalone script
if (require.main === module) {
  (async () => {
    try {
      await connectDB();

      await updateReviews();

      await closeDB();
      process.exit(0);
    } catch (error) {
      logger.error('Worker error:', error);
      process.exit(1);
    }
  })();
}

module.exports = { updateReviews };
