/**
 * Update News Worker
 * Fetches latest gaming news from NewsAPI
 * Run frequency: Every 15-30 minutes
 */

require('dotenv').config();
const { connectDB, closeDB } = require('../config/database');
const NewsArticle = require('../models/NewsArticle');
const { getGamingNews } = require('../services/newsService');
const logger = require('../utils/logger');

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .substring(0, 100);
};

const updateNews = async () => {
  try {
    logger.info('Starting news update...');

    // Fetch latest gaming news
    const newsResult = await getGamingNews(1, 30);

    logger.info(`Found ${newsResult.articles.length} news articles`);

    let created = 0;
    let skipped = 0;

    for (const article of newsResult.articles) {
      try {
        // Skip if no image or incomplete data
        if (!article.urlToImage || !article.title || !article.description) {
          skipped++;
          continue;
        }

        // Check if article already exists
        const existing = await NewsArticle.findOne({
          sourceType: 'newsapi',
          sourceUrl: article.url
        });

        if (existing) {
          skipped++;
          continue;
        }

        const slug = `${slugify(article.title)}-${Date.now()}`;

        // Create news article
        await NewsArticle.create({
          title: article.title,
          slug,
          summary: article.description,
          content: article.content || article.description,
          author: article.author || article.source,
          featuredImage: article.urlToImage,
          category: 'news',
          tags: ['gaming', 'news'],
          sourceType: 'newsapi',
          sourceUrl: article.url,
          sourceName: article.source,
          status: 'published',
          publishedAt: new Date(article.publishedAt),
          isPremium: false
        });

        created++;

      } catch (error) {
        logger.error(`Error processing article "${article.title}":`, error.message);
      }
    }

    logger.info(`News update complete: ${created} created, ${skipped} skipped`);

  } catch (error) {
    logger.error('Error in updateNews:', error);
    throw error;
  }
};

// Run as standalone script
if (require.main === module) {
  (async () => {
    try {
      await connectDB();

      await updateNews();

      await closeDB();
      process.exit(0);
    } catch (error) {
      logger.error('Worker error:', error);
      process.exit(1);
    }
  })();
}

module.exports = { updateNews };
