const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { auth } = require('../middleware');
const HybridRecommendationEngine = require('./hybridEngine');
const ContentBasedEngine = require('./contentBasedEngine');
// CollaborativeEngine is used by HybridRecommendationEngine internally

let fetch;
(async () => {
  const nodeFetch = await import('node-fetch');
  fetch = nodeFetch.default;
})();

const CONFIG = {
  EXTERNAL_API: {
    PRODUCTS: process.env.EXTERNAL_SKINCARE_API || (() => {
      throw new Error('EXTERNAL_SKINCARE_API environment variable is required');
    })()
  },
  LIMITS: {
    DEFAULT_RECOMMENDATIONS: parseInt(process.env.DEFAULT_RECOMMENDATIONS_LIMIT) || 10,
    EXTERNAL_API_LIMIT: parseInt(process.env.EXTERNAL_API_LIMIT) || 20
  },
  VALID_SKIN_TYPES: process.env.VALID_SKIN_TYPES?.split(',') || ['oily', 'dry', 'combination', 'normal', 'sensitive']
};

// Initialize recommendation engines
const hybridEngine = new HybridRecommendationEngine();
const contentEngine = new ContentBasedEngine();

const isMongoConnected = () => mongoose.connection.readyState === 1;

const logError = (location, err) => {
  const errorMsg = `Error in ${location}: ${err.message}`;

  if (process.env.NODE_ENV === 'development') {

    require('../utils/logger').error(errorMsg);
  }

  return errorMsg;
};

let User, Profile, Product, Interaction;
try {
  const models = require('../models');
  User = models.User;
  Profile = models.Profile;
  Product = models.Product;
  Interaction = require('./Interaction');
} catch (err) {
  logError('Models import in recommendations.js', err);
}

async function fetchProductsFromAPI(limit = CONFIG.LIMITS.EXTERNAL_API_LIMIT) {
  try {
    const response = await fetch(`${CONFIG.EXTERNAL_API.PRODUCTS}?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    logError('fetchProductsFromAPI', err);
    return [];
  }
}

const respond = (res, data, status = 200) => res.status(status).json(data);
const error = (res, msg, status = 500) => res.status(status).json({ msg });

router.get('/', auth, async (req, res) => {
  try {
    if (isMongoConnected() && User && Profile && Product) {
      const user = await User.findOne({ firebaseUid: req.user.uid });
      if (!user) return error(res, 'User not found', 404);

      const profile = await Profile.findOne({ user: user._id });
      if (!profile) return error(res, 'Profile not found', 404);

      // Get all products
      const products = await Product.find({});

      // Get user interactions for collaborative filtering
      const interactions = await Interaction.find({ userId: user._id });

      // Use the hybrid recommendation engine
      const recommendations = await hybridEngine.recommend(
        user._id.toString(),
        profile,
        products,
        interactions,
        { limit: CONFIG.LIMITS.DEFAULT_RECOMMENDATIONS, includeExplanations: true }
      );

      respond(res, recommendations);
    } else {
      const products = await fetchProductsFromAPI();
      respond(res, products);
    }
  } catch (err) {
    logError('/recommendations', err);
    error(res, 'Could not retrieve recommendations');
  }
});

const getRecommendations = async (query, res) => {
  try {
    if (isMongoConnected() && Product) {
      // Get all products
      const products = await Product.find({});

      // Create a profile based on query parameters
      const userProfile = {
        skinType: query.skinTypes || process.env.DEFAULT_SKIN_TYPE || 'normal',
        skinConcerns: query.skinConcerns || [],
        sustainabilityPreference: query.isSustainable || false
      };

      // Use content-based filtering for non-authenticated users
      const recommendations = contentEngine.recommend(
        userProfile,
        products,
        [],
        CONFIG.LIMITS.DEFAULT_RECOMMENDATIONS
      );

      respond(res, recommendations);
    } else {
      const allProducts = await fetchProductsFromAPI();

      // Fix filtering logic - apply filters sequentially to avoid overwriting
      let filteredProducts = [...allProducts]; // Create a copy to avoid mutation

      if (query.isSustainable) {
        filteredProducts = filteredProducts.filter(p => p.isSustainable);
      }

      if (query.skinTypes) {
        filteredProducts = filteredProducts.filter(p =>
          p.skinTypes && p.skinTypes.includes(query.skinTypes)
        );
      }

      respond(res, filteredProducts.slice(0, CONFIG.LIMITS.DEFAULT_RECOMMENDATIONS));
    }
  } catch (err) {
    logError('/recommendations/filtered', err);
    error(res, 'Could not retrieve recommendations');
  }
};

router.get('/trending', (_req, res) => getRecommendations({}, res));

router.get('/sustainable', (_req, res) => getRecommendations({ isSustainable: true }, res));

router.get('/skin-type/:type', (req, res) => {
  if (!CONFIG.VALID_SKIN_TYPES.includes(req.params.type)) {
    return error(res, 'Invalid skin type', 400);
  }
  getRecommendations({ skinTypes: req.params.type }, res);
});

// Track user interactions with products
router.post('/track-interaction', auth, async (req, res) => {
  try {
    if (!isMongoConnected() || !Interaction) {
      return error(res, 'Database connection required for tracking interactions', 503);
    }

    const { productId, interactionType, rating, timeSpent, metadata } = req.body;

    if (!productId || !interactionType) {
      return error(res, 'Product ID and interaction type are required', 400);
    }

    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return error(res, 'User not found', 404);

    const interaction = await Interaction.createInteraction({
      user: user._id,
      product: productId,
      type: interactionType,
      rating,
      timeSpent,
      metadata
    });

    await interaction.save();
    respond(res, { success: true, message: 'Interaction tracked successfully' });
  } catch (err) {
    logError('/track-interaction', err);
    error(res, 'Failed to track interaction');
  }
});

// Get recommendation metrics
router.get('/metrics', auth, async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return error(res, 'Database connection required for metrics', 503);
    }

    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return error(res, 'User not found', 404);

    // Calculate metrics based on user interactions
    const interactions = await Interaction.find({ userId: user._id });
    const purchases = interactions.filter(i => i.interactionType === 'purchase').length;
    const views = interactions.filter(i => i.interactionType === 'view').length;

    // Calculate click-through rate
    const ctr = views > 0 ? (purchases / views) * 100 : 0;

    respond(res, {

      purchases,
      ctr: `${ctr.toFixed(2)}%`,
      conversionRate: `${(purchases / Math.max(interactions.length, 1) * 100).toFixed(2)}%`
    });
  } catch (err) {
    logError('/metrics', err);
    error(res, 'Failed to retrieve metrics');
  }
});

module.exports = router;
