/**
 * Database Seed Script
 * Populates database with sample data for development and testing
 */

require('dotenv').config();
const { connectDB, closeDB } = require('../backend/config/database');
const User = require('../backend/models/User');
const Game = require('../backend/models/Game');
const NewsArticle = require('../backend/models/NewsArticle');
const Review = require('../backend/models/Review');
const LeaderboardEntry = require('../backend/models/LeaderboardEntry');
const logger = require('../backend/utils/logger');

const sampleGames = [
  {
    steamAppId: 730,
    rawgId: 4291,
    name: 'Counter-Strike 2',
    slug: 'counter-strike-2',
    description: 'For over two decades, Counter-Strike has offered an elite competitive experience...',
    shortDescription: 'The legendary FPS game continues with CS2.',
    headerImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/730/header.jpg',
    backgroundImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/730/page_bg_generated_v6b.jpg',
    releaseDate: new Date('2023-09-27'),
    genres: ['Action', 'FPS'],
    tags: ['FPS', 'Multiplayer', 'Competitive', 'Shooter'],
    platforms: ['PC', 'Windows', 'Linux', 'Mac'],
    developers: ['Valve'],
    publishers: ['Valve'],
    rating: 4.5,
    metacriticScore: 87,
    currentPlayers: 1200000,
    peakPlayers: 1500000,
    featured: true,
    trending: true,
    isActive: true,
    steamData: {
      isFree: true,
      achievements: 167,
      recommendations: 5000000
    }
  },
  {
    steamAppId: 1172470,
    rawgId: 58175,
    name: 'Apex Legends',
    slug: 'apex-legends',
    description: 'Conquer with character in Apex Legends, a free-to-play Hero shooter...',
    shortDescription: 'Free-to-play hero shooter battle royale.',
    headerImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1172470/header.jpg',
    releaseDate: new Date('2020-11-04'),
    genres: ['Action', 'Battle Royale'],
    tags: ['Battle Royale', 'FPS', 'Multiplayer', 'Hero Shooter'],
    platforms: ['PC', 'PlayStation', 'Xbox'],
    developers: ['Respawn Entertainment'],
    publishers: ['Electronic Arts'],
    rating: 4.2,
    currentPlayers: 450000,
    peakPlayers: 600000,
    featured: true,
    trending: true,
    isActive: true,
    steamData: {
      isFree: true,
      achievements: 134
    }
  },
  {
    steamAppId: 570,
    rawgId: 19102,
    name: 'Dota 2',
    slug: 'dota-2',
    description: 'Every day, millions of players worldwide enter battle as one of over a hundred Dota heroes...',
    shortDescription: 'The ultimate MOBA experience.',
    headerImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/570/header.jpg',
    releaseDate: new Date('2013-07-09'),
    genres: ['MOBA', 'Strategy'],
    tags: ['MOBA', 'Multiplayer', 'Strategy', 'Competitive'],
    platforms: ['PC', 'Windows', 'Linux', 'Mac'],
    developers: ['Valve'],
    publishers: ['Valve'],
    rating: 4.4,
    metacriticScore: 90,
    currentPlayers: 800000,
    peakPlayers: 1200000,
    featured: true,
    isActive: true,
    steamData: {
      isFree: true,
      achievements: 0
    }
  },
  {
    steamAppId: 1203220,
    rawgId: 326243,
    name: 'NARAKA: BLADEPOINT',
    slug: 'naraka-bladepoint',
    description: 'NARAKA: BLADEPOINT is an up to 60-player PVP mythical action combat experience...',
    shortDescription: 'Mythical action battle royale.',
    headerImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1203220/header.jpg',
    releaseDate: new Date('2021-08-12'),
    genres: ['Action', 'Battle Royale'],
    tags: ['Battle Royale', 'Martial Arts', 'Multiplayer'],
    platforms: ['PC', 'PlayStation', 'Xbox'],
    developers: ['24 Entertainment'],
    publishers: ['NetEase Games'],
    rating: 4.0,
    currentPlayers: 25000,
    peakPlayers: 150000,
    isActive: true,
    steamData: {
      price: 19.99,
      currency: 'USD'
    }
  },
  {
    steamAppId: 578080,
    rawgId: 3439,
    name: 'PUBG: BATTLEGROUNDS',
    slug: 'pubg-battlegrounds',
    description: 'Play BATTLEGROUNDS for free. Land, loot and survive...',
    shortDescription: 'The original battle royale game.',
    headerImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/578080/header.jpg',
    releaseDate: new Date('2017-12-21'),
    genres: ['Action', 'Battle Royale'],
    tags: ['Battle Royale', 'Survival', 'Multiplayer', 'Shooter'],
    platforms: ['PC', 'PlayStation', 'Xbox', 'Mobile'],
    developers: ['KRAFTON, Inc.'],
    publishers: ['KRAFTON, Inc.'],
    rating: 3.8,
    currentPlayers: 350000,
    peakPlayers: 3200000,
    isActive: true,
    steamData: {
      isFree: true
    }
  }
];

const sampleNews = [
  {
    title: 'Counter-Strike 2 Reaches New Player Peak',
    slug: 'counter-strike-2-reaches-new-player-peak',
    summary: 'Valve\'s latest iteration of Counter-Strike has broken concurrent player records.',
    content: 'Counter-Strike 2 has reached an all-time high of 1.5 million concurrent players, marking a significant milestone for the franchise...',
    category: 'news',
    featuredImage: 'https://picsum.photos/800/450?random=1',
    tags: ['Counter-Strike', 'Valve', 'FPS'],
    status: 'published',
    sourceType: 'manual',
    publishedAt: new Date(),
    views: 12543,
    likes: 423
  },
  {
    title: 'Apex Legends Season 20 Reveals New Legend',
    slug: 'apex-legends-season-20-reveals-new-legend',
    summary: 'Respawn Entertainment announces exciting new content for the upcoming season.',
    content: 'The next season of Apex Legends brings a brand new Legend with unique abilities that will shake up the meta...',
    category: 'announcement',
    featuredImage: 'https://picsum.photos/800/450?random=2',
    tags: ['Apex Legends', 'Battle Royale', 'Season Update'],
    status: 'published',
    sourceType: 'manual',
    publishedAt: new Date(Date.now() - 86400000),
    views: 8932,
    likes: 312
  },
  {
    title: 'Dota 2 International Championship Announced',
    slug: 'dota-2-international-championship-announced',
    summary: 'The biggest esports event of the year gets dates and prize pool details.',
    content: 'Valve has announced The International 2024, featuring a record-breaking prize pool and teams from around the globe...',
    category: 'esports',
    featuredImage: 'https://picsum.photos/800/450?random=3',
    tags: ['Dota 2', 'Esports', 'Tournament'],
    status: 'published',
    sourceType: 'manual',
    publishedAt: new Date(Date.now() - 172800000),
    views: 15234,
    likes: 892
  }
];

const seedDatabase = async () => {
  try {
    logger.info('🌱 Starting database seed...');

    await connectDB();

    // Clear existing data
    logger.info('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Game.deleteMany({}),
      NewsArticle.deleteMany({}),
      Review.deleteMany({}),
      LeaderboardEntry.deleteMany({})
    ]);

    // Create admin user
    logger.info('Creating admin user...');
    const admin = await User.create({
      username: 'admin',
      email: process.env.ADMIN_EMAIL || 'admin@knightgaming.com',
      password: process.env.ADMIN_PASSWORD || 'Admin123!',
      role: 'admin',
      verified: true,
      subscription: {
        status: 'active',
        tier: 'premium'
      },
      profile: {
        displayName: 'KnightGaming Admin',
        bio: 'Platform administrator'
      }
    });

    // Create sample users
    logger.info('Creating sample users...');
    const user1 = await User.create({
      username: 'gamer_pro',
      email: 'gamer@example.com',
      password: 'Password123!',
      verified: true,
      profile: {
        displayName: 'Pro Gamer',
        bio: 'Competitive FPS player'
      }
    });

    const user2 = await User.create({
      username: 'casual_player',
      email: 'casual@example.com',
      password: 'Password123!',
      verified: true,
      subscription: {
        status: 'active',
        tier: 'premium'
      },
      profile: {
        displayName: 'Casual Gamer',
        bio: 'Just here for fun'
      }
    });

    // Create games
    logger.info('Creating sample games...');
    const games = await Game.insertMany(sampleGames);

    // Create news articles
    logger.info('Creating sample news...');
    const news = await NewsArticle.insertMany(
      sampleNews.map(article => ({
        ...article,
        authorId: admin._id,
        games: [games[0]._id]
      }))
    );

    // Create sample reviews
    logger.info('Creating sample reviews...');
    const reviews = [
      {
        game: games[0]._id,
        user: user1._id,
        rating: 5,
        title: 'Best FPS Ever!',
        content: 'Counter-Strike 2 is absolutely amazing. The graphics are stunning, the gameplay is smooth, and the competitive scene is thriving. Highly recommend!',
        tags: ['gameplay', 'graphics', 'multiplayer'],
        hoursPlayed: 500,
        recommendGame: true,
        status: 'approved',
        helpfulCount: 45
      },
      {
        game: games[0]._id,
        user: user2._id,
        rating: 4,
        title: 'Great game but steep learning curve',
        content: 'CS2 is fantastic for experienced players, but new players might find it challenging. The community can be tough on beginners.',
        tags: ['gameplay', 'multiplayer'],
        hoursPlayed: 120,
        recommendGame: true,
        status: 'approved',
        helpfulCount: 23
      },
      {
        game: games[1]._id,
        user: user1._id,
        rating: 4,
        title: 'Best Battle Royale',
        content: 'Apex Legends offers unique hero abilities that set it apart from other BR games. Fast-paced and exciting!',
        tags: ['gameplay', 'multiplayer'],
        hoursPlayed: 300,
        recommendGame: true,
        status: 'approved',
        helpfulCount: 67
      }
    ];

    await Review.insertMany(reviews);

    // Create leaderboard entries
    logger.info('Creating sample leaderboard entries...');
    const leaderboardEntries = [
      {
        game: games[0]._id,
        user: user1._id,
        playerName: user1.profile.displayName,
        score: 98765,
        category: 'competitive',
        metadata: {
          kills: 1234,
          deaths: 567,
          winRate: 0.65
        },
        status: 'verified',
        achievedAt: new Date()
      },
      {
        game: games[0]._id,
        user: user2._id,
        playerName: user2.profile.displayName,
        score: 87654,
        category: 'competitive',
        metadata: {
          kills: 987,
          deaths: 432,
          winRate: 0.58
        },
        status: 'verified',
        achievedAt: new Date()
      }
    ];

    await LeaderboardEntry.insertMany(leaderboardEntries);

    // Update game stats
    for (const game of games) {
      const gameReviews = await Review.find({ game: game._id, status: 'approved' });
      if (gameReviews.length > 0) {
        const avgRating = gameReviews.reduce((sum, r) => sum + r.rating, 0) / gameReviews.length;
        await Game.findByIdAndUpdate(game._id, {
          reviewCount: gameReviews.length,
          averageReviewScore: avgRating
        });
      }
    }

    logger.info('✅ Database seed completed successfully!');
    logger.info('');
    logger.info('📝 Sample Credentials:');
    logger.info(`   Admin: ${admin.email} / ${process.env.ADMIN_PASSWORD || 'Admin123!'}`);
    logger.info(`   User 1: ${user1.email} / Password123!`);
    logger.info(`   User 2: ${user2.email} / Password123!`);
    logger.info('');
    logger.info(`📊 Created:`);
    logger.info(`   - ${await User.countDocuments()} users`);
    logger.info(`   - ${await Game.countDocuments()} games`);
    logger.info(`   - ${await NewsArticle.countDocuments()} news articles`);
    logger.info(`   - ${await Review.countDocuments()} reviews`);
    logger.info(`   - ${await LeaderboardEntry.countDocuments()} leaderboard entries`);

  } catch (error) {
    logger.error('❌ Seed error:', error);
    throw error;
  } finally {
    await closeDB();
  }
};

// Run seed
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error(error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
