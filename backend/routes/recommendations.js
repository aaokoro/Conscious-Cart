const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { auth } = require('../middleware');
const HybridRecommendationEngine = require('../ml/hybridEngine');

const isMongoConnected = () => mongoose.connection.readyState === 1;

const logError = (location, err) => {
  return `Error in ${location}: ${err.message}`;
};

// Define mock models for fallback
const mockModel = {
  find: () => Promise.resolve([]),
  findOne: () => Promise.resolve(null),
  lean: () => []
};

// Import models with proper error handling
let User, Profile, Product, Interaction;
try {
  const models = require('../models');
  User = models.User;
  Profile = models.Profile;
  Product = models.Product;
  Interaction = models.Interaction;
} catch (err) {
  logError('Models import in recommendations.js', err);
  User = mockModel;
  Profile = mockModel;
  Product = mockModel;
  Interaction = mockModel;
}

// Initialize the hybrid recommendation engine
const hybridEngine = new HybridRecommendationEngine();

const EXTERNAL_API = {
  PRODUCTS: 'https://skincare-api.herokuapp.com/products'
};

async function fetchProductsFromAPI(limit = 20) {
  try {
    const response = await fetch(`${EXTERNAL_API.PRODUCTS}?limit=${limit}`);
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
      const products = await Product.find({}).lean();

      // Get user interactions
      let interactions = [];
      if (Interaction) {
        try {
          interactions = await Interaction.find({}).lean();
        } catch (err) {
          logError('Fetching interactions', err);
        }
      }

      // Use the hybrid engine for recommendations
      try {
        const recommendations = await hybridEngine.recommend(
          user._id.toString(),
          profile,
          products,
          interactions,
          { limit: 10, includeExplanations: true }
        );

        // Log recommendation quality metrics
        const logData = {
          userId: user._id.toString(),
          timestamp: new Date(),
          userProfile: {
            skinType: profile.skinType,
            skinConcerns: profile.skinConcerns
          },
          recommendationCount: recommendations.length,
          topRecommendations: recommendations.slice(0, 3).map(rec => ({
            productId: rec.product.id,
            productName: rec.product.name,
            score: rec.score,
            matchingConcerns: rec.product.skinConcerns?.filter(c =>
              profile.skinConcerns?.includes(c)
            ) || []
          }))
        };

        // Calculate recommendation quality metrics
        const concernMatchCount = recommendations.reduce((count, rec) => {
          const matchingConcerns = rec.product.skinConcerns?.filter(c =>
            profile.skinConcerns?.includes(c)
          ) || [];
          return count + (matchingConcerns.length > 0 ? 1 : 0);
        }, 0);

        const concernMatchRate = concernMatchCount / Math.max(recommendations.length, 1);
        logData.metrics = {
          concernMatchRate: concernMatchRate,
          concernMatchPercentage: `${(concernMatchRate * 100).toFixed(1)}%`
        };

        // Remove console logging as requested by user

        respond(res, recommendations);
      } catch (err) {
        logError('Hybrid engine recommendation', err);

        // Fallback to basic filtering if hybrid engine fails
        const query = { skinTypes: profile.skinType };
        if (profile.skinConcerns?.length > 0) query.skinConcerns = { $in: profile.skinConcerns };
        if (profile.sustainabilityPreference) query.isSustainable = true;

        const fallbackRecs = await Product.find(query).sort({ rating: -1 }).limit(10);
        respond(res, fallbackRecs);
      }
    } else {
      // Fetch from external API instead of using mock data
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
      const products = await Product.find(query).sort({ rating: -1 }).limit(10);
      respond(res, products);
    } else {
      const allProducts = await fetchProductsFromAPI();

      let filteredProducts = allProducts;
      if (query.isSustainable) {
        filteredProducts = allProducts.filter(p => p.isSustainable);
      }
      if (query.skinTypes) {
        filteredProducts = allProducts.filter(p => p.skinTypes && p.skinTypes.includes(query.skinTypes));
      }
      respond(res, filteredProducts);
    }
  } catch (err) {
    logError('/recommendations/filtered', err);
    error(res, 'Could not retrieve recommendations');
  }
};

router.get('/trending', (_req, res) => getRecommendations({}, res));

router.get('/sustainable', (_req, res) => getRecommendations({ isSustainable: true }, res));

router.get('/skin-type/:type', (req, res) => {
  const validTypes = ['oily', 'dry', 'combination', 'normal', 'sensitive'];
  if (!validTypes.includes(req.params.type)) return error(res, 'Invalid skin type', 400);
  getRecommendations({ skinTypes: req.params.type }, res);
});

module.exports = router;
