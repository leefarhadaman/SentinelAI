const { validationResult } = require('express-validator');
const { buildPrompt } = require('../utils/promptBuilder');
const { analyzeCode } = require('../services/aiService');
const Review = require('../models/reviewModel');

/**
 * POST /api/review
 * Handles the full code review pipeline.
 */
const reviewCode = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { code, language } = req.body;

  try {
    console.log(`📝 Building prompt for language: ${language}`);
    const prompt = buildPrompt(code, language);

    console.log(`🤖 Sending request to AI model: ${process.env.AI_MODEL}`);
    const rawResponse = await analyzeCode(prompt);

    let parsedResponse;
    try {
      const cleaned = rawResponse
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();
      parsedResponse = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('⚠️ Failed to parse AI response as JSON:', rawResponse);
      parsedResponse = {
        issues: ['AI response could not be parsed. Please retry.'],
        security: [],
        suggestions: [],
        optimizedCode: code,
      };
    }

    const aiResponse = {
      issues: Array.isArray(parsedResponse.issues) ? parsedResponse.issues : [],
      security: Array.isArray(parsedResponse.security) ? parsedResponse.security : [],
      suggestions: Array.isArray(parsedResponse.suggestions) ? parsedResponse.suggestions : [],
      optimizedCode: parsedResponse.optimizedCode || '',
    };

    const review = await Review.create({ code, language, aiResponse });
    console.log(`✅ Review saved to DB with ID: ${review._id}`);

    return res.status(200).json({
      success: true,
      reviewId: review._id,
      language: review.language,
      createdAt: review.createdAt,
      ...aiResponse,
    });
  } catch (error) {
    console.error(`❌ Review controller error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

/**
 * GET /api/review/history
 * Returns the last 20 reviews from MongoDB.
 */
const getReviewHistory = async (req, res) => {
  try {
    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .select('-__v');
    return res.status(200).json({ success: true, count: reviews.length, reviews });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/review/:id
 * Returns a single review by MongoDB ID.
 */
const getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id).select('-__v');
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    return res.status(200).json({ success: true, review });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { reviewCode, getReviewHistory, getReviewById };
