/**
 * OpenAI Service
 * AI-powered content generation using OpenAI API
 */

const OpenAI = require('openai');
const crypto = require('crypto');
const logger = require('../utils/logger');
const AISummaryCache = require('../models/AISummaryCache');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
const MAX_TOKENS = parseInt(process.env.OPENAI_MAX_TOKENS) || 500;

/**
 * Generate a hash for caching
 */
const generateHash = (input) => {
  return crypto.createHash('md5').update(input).digest('hex');
};

/**
 * Check OpenAI moderation
 */
const checkModeration = async (text) => {
  try {
    const moderation = await openai.moderations.create({
      input: text
    });

    const results = moderation.results[0];
    return {
      passed: !results.flagged,
      flags: results.categories
    };
  } catch (error) {
    logger.error('OpenAI moderation error:', error);
    return { passed: true, flags: {} }; // Allow by default if moderation fails
  }
};

/**
 * Generate AI summary of text
 */
const generateSummary = async (text, maxWords = 120, contentType = 'news', contentId = '') => {
  try {
    // Create cache key
    const inputHash = generateHash(`${text}:${maxWords}`);
    
    // Check cache first
    const cached = await AISummaryCache.findOne({
      inputHash,
      summaryType: 'summary'
    });

    if (cached && cached.isValid()) {
      await cached.recordHit();
      return {
        summary: cached.output,
        cached: true,
        tokensUsed: 0
      };
    }

    // Generate new summary
    const prompt = `Summarize the following text in ${maxWords} words or less. Focus on the key points and make it engaging for gamers:\n\n${text}`;

    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: 'You are a gaming content writer who creates concise, engaging summaries.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: MAX_TOKENS,
      temperature: 0.7
    });

    const summary = completion.choices[0].message.content.trim();
    const tokensUsed = {
      prompt: completion.usage.prompt_tokens,
      completion: completion.usage.completion_tokens,
      total: completion.usage.total_tokens
    };

    // Check moderation
    const moderation = await checkModeration(summary);

    // Cache the result (24 hours)
    await AISummaryCache.create({
      contentType,
      contentId,
      inputHash,
      inputText: text.substring(0, 1000), // Store first 1000 chars
      summaryType: 'summary',
      output: summary,
      model: DEFAULT_MODEL,
      tokensUsed,
      cost: (tokensUsed.total / 1000) * 0.002, // Approximate cost
      moderationPassed: moderation.passed,
      moderationFlags: Object.keys(moderation.flags).filter(k => moderation.flags[k]),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    logger.info(`Generated AI summary (${tokensUsed.total} tokens)`);

    return {
      summary,
      cached: false,
      tokensUsed: tokensUsed.total,
      moderationPassed: moderation.passed
    };
  } catch (error) {
    logger.error('Error generating AI summary:', error);
    throw new Error('Failed to generate summary');
  }
};

/**
 * Generate trend highlights from player count data
 */
const generateTrendHighlight = async (gameName, playerData) => {
  try {
    const inputHash = generateHash(`trend:${gameName}:${JSON.stringify(playerData)}`);
    
    // Check cache
    const cached = await AISummaryCache.findOne({
      inputHash,
      summaryType: 'trend_highlight'
    });

    if (cached && cached.isValid()) {
      await cached.recordHit();
      return { highlight: cached.output, cached: true, tokensUsed: 0 };
    }

    // Prepare data summary
    const dataStr = playerData.map(d => `${d.date}: ${d.count} players`).join(', ');
    const prompt = `Analyze this player count trend for ${gameName} and create a brief, engaging highlight (40-80 words) explaining the trend, potential reasons, and what it means for players:\n\n${dataStr}`;

    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: 'You are a gaming analyst who explains player trends in an exciting, accessible way.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: MAX_TOKENS,
      temperature: 0.8
    });

    const highlight = completion.choices[0].message.content.trim();
    const tokensUsed = {
      prompt: completion.usage.prompt_tokens,
      completion: completion.usage.completion_tokens,
      total: completion.usage.total_tokens
    };

    // Cache result
    await AISummaryCache.create({
      contentType: 'trend',
      contentId: gameName,
      inputHash,
      summaryType: 'trend_highlight',
      output: highlight,
      model: DEFAULT_MODEL,
      tokensUsed,
      cost: (tokensUsed.total / 1000) * 0.002,
      moderationPassed: true,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    logger.info(`Generated trend highlight for ${gameName} (${tokensUsed.total} tokens)`);

    return {
      highlight,
      cached: false,
      tokensUsed: tokensUsed.total
    };
  } catch (error) {
    logger.error('Error generating trend highlight:', error);
    throw new Error('Failed to generate trend highlight');
  }
};

/**
 * Generate social media post suggestions
 */
const generateSocialSuggestions = async (content, platform = 'twitter', count = 3) => {
  try {
    const inputHash = generateHash(`social:${platform}:${content}:${count}`);
    
    // Check cache
    const cached = await AISummaryCache.findOne({
      inputHash,
      summaryType: 'social_suggestion'
    });

    if (cached && cached.isValid()) {
      await cached.recordHit();
      return {
        suggestions: cached.alternatives || [cached.output],
        cached: true,
        tokensUsed: 0
      };
    }

    const charLimit = platform === 'twitter' ? 280 : 500;
    const prompt = `Create ${count} engaging ${platform} posts (max ${charLimit} characters each) based on this content. Make them exciting and include relevant hashtags:\n\n${content}`;

    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: 'You are a social media expert for gaming communities. Create engaging, shareable posts.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: MAX_TOKENS,
      temperature: 0.9,
      n: 1
    });

    const response = completion.choices[0].message.content.trim();
    const suggestions = response.split('\n\n').filter(s => s.trim().length > 0).slice(0, count);

    const tokensUsed = {
      prompt: completion.usage.prompt_tokens,
      completion: completion.usage.completion_tokens,
      total: completion.usage.total_tokens
    };

    // Cache result
    await AISummaryCache.create({
      contentType: 'social_post',
      contentId: platform,
      inputHash,
      summaryType: 'social_suggestion',
      output: suggestions[0],
      alternatives: suggestions,
      model: DEFAULT_MODEL,
      tokensUsed,
      cost: (tokensUsed.total / 1000) * 0.002,
      moderationPassed: true,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    logger.info(`Generated ${suggestions.length} social suggestions (${tokensUsed.total} tokens)`);

    return {
      suggestions,
      cached: false,
      tokensUsed: tokensUsed.total
    };
  } catch (error) {
    logger.error('Error generating social suggestions:', error);
    throw new Error('Failed to generate social suggestions');
  }
};

/**
 * Get cached summary by article ID
 */
const getCachedSummary = async (articleId) => {
  const cached = await AISummaryCache.findOne({
    contentType: 'news',
    contentId: articleId,
    summaryType: 'summary'
  });

  if (cached && cached.isValid()) {
    await cached.recordHit();
    return cached.output;
  }

  return null;
};

/**
 * Get AI usage stats
 */
const getUsageStats = async (userId = null, days = 30) => {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const stats = await AISummaryCache.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalRequests: { $sum: 1 },
        totalTokens: { $sum: '$tokensUsed.total' },
        totalCost: { $sum: '$cost' },
        totalHits: { $sum: '$hitCount' }
      }
    }
  ]);

  return stats[0] || {
    totalRequests: 0,
    totalTokens: 0,
    totalCost: 0,
    totalHits: 0
  };
};

module.exports = {
  generateSummary,
  generateTrendHighlight,
  generateSocialSuggestions,
  getCachedSummary,
  checkModeration,
  getUsageStats
};
