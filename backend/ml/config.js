require('dotenv').config();

const ML_CONFIG = {
  CONTENT_BASED: {
    INGREDIENT_WEIGHTS: {
      'hyaluronic acid': parseFloat(process.env.ML_INGREDIENT_HYALURONIC_ACID) || 0.9,
      'retinol': parseFloat(process.env.ML_INGREDIENT_RETINOL) || 0.8,
      'niacinamide': parseFloat(process.env.ML_INGREDIENT_NIACINAMIDE) || 0.7,
      'salicylic acid': parseFloat(process.env.ML_INGREDIENT_SALICYLIC_ACID) || 0.8,
      'glycolic acid': parseFloat(process.env.ML_INGREDIENT_GLYCOLIC_ACID) || 0.7,
      'ceramides': parseFloat(process.env.ML_INGREDIENT_CERAMIDES) || 0.6
    },
    SKIN_TYPES: process.env.ML_SKIN_TYPES?.split(',') || ['oily', 'dry', 'combination', 'normal', 'sensitive'],
    SKIN_CONCERNS: process.env.ML_SKIN_CONCERNS?.split(',') || ['acne', 'aging', 'dryness', 'sensitivity', 'hyperpigmentation', 'redness'],
    PRICE_TIERS: {
      LOW: parseFloat(process.env.ML_PRICE_TIER_LOW) || 20,
      MEDIUM: parseFloat(process.env.ML_PRICE_TIER_MEDIUM) || 40,
      HIGH: parseFloat(process.env.ML_PRICE_TIER_HIGH) || 60
    },
    DEFAULTS: {
      AVERAGE_PRICE: parseFloat(process.env.ML_DEFAULT_AVG_PRICE) || 30,
      AVERAGE_RATING: parseFloat(process.env.ML_DEFAULT_AVG_RATING) || 4.0,
      RECOMMENDATION_LIMIT: parseInt(process.env.ML_DEFAULT_RECOMMENDATION_LIMIT) || 10
    }
  },

  COLLABORATIVE: {
    SIMILARITY_THRESHOLD: parseFloat(process.env.ML_SIMILARITY_THRESHOLD) || 0.3,
    SIMILAR_USERS_LIMIT: parseInt(process.env.ML_SIMILAR_USERS_LIMIT) || 50,
    MIN_COMMON_ITEMS: parseInt(process.env.ML_MIN_COMMON_ITEMS) || 2,
    IMPLICIT_RATING: {
      VIEW_WEIGHT: parseFloat(process.env.ML_VIEW_WEIGHT) || 1,
      TIME_THRESHOLD: parseInt(process.env.ML_TIME_THRESHOLD) || 30,
      TIME_WEIGHT: parseFloat(process.env.ML_TIME_WEIGHT) || 1,
      PURCHASE_WEIGHT: parseFloat(process.env.ML_PURCHASE_WEIGHT) || 3,
      FAVORITE_WEIGHT: parseFloat(process.env.ML_FAVORITE_WEIGHT) || 2,
      REVIEW_WEIGHT: parseFloat(process.env.ML_REVIEW_WEIGHT) || 1,
      MAX_RATING: parseFloat(process.env.ML_MAX_RATING) || 5
    },
    DEFAULT_LIMIT: parseInt(process.env.ML_COLLABORATIVE_LIMIT) || 10
  },

  HYBRID: {
    WEIGHTS: {
      CONTENT: parseFloat(process.env.ML_WEIGHT_CONTENT) || 0.6,
      COLLABORATIVE: parseFloat(process.env.ML_WEIGHT_COLLABORATIVE) || 0.4,
      POPULARITY: parseFloat(process.env.ML_WEIGHT_POPULARITY) || 0.1,
      DIVERSITY: parseFloat(process.env.ML_WEIGHT_DIVERSITY) || 0.1
    },
    LIMITS: {
      DEFAULT: parseInt(process.env.ML_HYBRID_DEFAULT_LIMIT) || 10,
      MULTIPLIER: parseFloat(process.env.ML_HYBRID_MULTIPLIER) || 2
    },
    DIVERSITY: {
      SAME_BRAND_PENALTY: parseFloat(process.env.ML_SAME_BRAND_PENALTY) || 0.8,
      SIMILAR_CONCERNS_PENALTY: parseFloat(process.env.ML_SIMILAR_CONCERNS_PENALTY) || 0.9,
      HIGH_OVERLAP_THRESHOLD: parseFloat(process.env.ML_HIGH_OVERLAP_THRESHOLD) || 0.8
    },
    WEIGHT_ADJUSTMENT: {
      MAX_WEIGHT: parseFloat(process.env.ML_MAX_WEIGHT) || 0.8,
      MIN_WEIGHT: parseFloat(process.env.ML_MIN_WEIGHT) || 0.2,
      STEP: parseFloat(process.env.ML_WEIGHT_STEP) || 0.1
    }
  },

  // General ML Configuration
  GENERAL: {
    CONFIDENCE_THRESHOLD: parseFloat(process.env.ML_CONFIDENCE_THRESHOLD) || 0.5,
    CACHE_TTL: parseInt(process.env.ML_CACHE_TTL) || 3600, // 1 hour in seconds
    MAX_RECOMMENDATIONS: parseInt(process.env.ML_MAX_RECOMMENDATIONS) || 50
  }
};

module.exports = ML_CONFIG;
