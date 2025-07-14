const express = require('express');
const router = express.Router();
const { auth } = require('../middleware');


const respond = (res, data, status = 200) => res.status(status).json(data);
const error = (res, msg, status = 500) => res.status(status).json({ msg });

// In-memory storage for favorites (in production, this would be in a database)
const userFavorites = new Map(); // userId -> Set of productIds

// POST /favorites - Add product to favorites
router.post('/', auth, async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.uid;

    if (!productId) {
      return error(res, 'Product ID is required', 400);
    }

    if (!userFavorites.has(userId)) {
      userFavorites.set(userId, new Set());
    }

    const favorites = userFavorites.get(userId);
    favorites.add(productId.toString());

    respond(res, {
      message: 'Product added to favorites',
      productId,
      isFavorite: true
    });
  } catch (err) {
    error(res, 'Could not add to favorites');
  }
});

router.delete('/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.uid;

    if (!userFavorites.has(userId)) {
      return respond(res, {
        message: 'Product removed from favorites',
        productId,
        isFavorite: false
      });
    }

    const favorites = userFavorites.get(userId);
    favorites.delete(productId.toString());

    respond(res, {
      message: 'Product removed from favorites',
      productId,
      isFavorite: false
    });
  } catch (err) {
    error(res, 'Could not remove from favorites');
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.uid;

    if (!userFavorites.has(userId)) {
      return respond(res, []);
    }

    const favoriteProductIds = Array.from(userFavorites.get(userId));

    if (favoriteProductIds.length === 0) {
      return respond(res, []);
    }

    // Fetch the actual product data for the favorite product IDs
    const { Product } = require('../models');
    const mongoose = require('mongoose');

    if (mongoose.connection.readyState === 1 && Product) {
      // If MongoDB is connected, fetch from database
      const favoriteProducts = await Product.find({
        _id: { $in: favoriteProductIds.map(id => {
          try {
            return new mongoose.Types.ObjectId(id);
          } catch {
            return null;
          }
        }).filter(id => id !== null) }
      });

      const formattedProducts = favoriteProducts.map(product => ({
        id: product._id,
        name: product.name,
        brand: product.brand,
        price: product.price || 29.99,
        rating: product.rating || 4.2,
        description: product.description || `A quality ${product.name} from ${product.brand}`,
        ingredient_list: product.ingredient_list || product.ingredients || [],
        skinTypes: product.skinTypes || ['All'],
        skinConcerns: product.skinConcerns || [],
        isSustainable: product.isSustainable || false
      }));

      respond(res, formattedProducts);
    } else {
      respond(res, []);
    }
  } catch (err) {
    console.error('Error fetching favorites:', err);
    error(res, 'Could not retrieve favorites');
  }
});

router.get('/check/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.uid;

    const isFavorite = userFavorites.has(userId) &&
                      userFavorites.get(userId).has(productId.toString());

    respond(res, {
      productId,
      isFavorite
    });
  } catch (err) {
    error(res, 'Could not check favorite status');
  }
});

module.exports = router;
