const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { auth } = require('../middleware');

const isMongoConnected = () => mongoose.connection.readyState === 1;

const logError = (location, err) => {
  const errorMsg = `Error in ${location}: ${err.message}`;
  return errorMsg;
};

let User, Profile, Product;
try {
  const models = require('../models');
  User = models.User;
  Profile = models.Profile;
  Product = models.Product;
} catch (err) {
  logError('Models import in recommendations.js', err);
}

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

      const query = { skinTypes: profile.skinType };
      if (profile.skinConcerns?.length > 0) query.skinConcerns = { $in: profile.skinConcerns };
      if (profile.sustainabilityPreference) query.isSustainable = true;

      const recommendations = await Product.find(query).sort({ rating: -1 }).limit(10);
      respond(res, recommendations);
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
