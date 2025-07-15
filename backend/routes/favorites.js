const express = require('express');
const router = express.Router();
const { auth } = require('../middleware');


const mockProducts = [
  {
    id: 1,
    name: "gentle hydrating cleanser",
    brand: "cerave",
    price: 24.99,
    rating: 4.5,
    description: "A gentle, non-drying cleanser perfect for sensitive skin with ceramides and hyaluronic acid.",
    ingredient_list: ["water", "ceramides", "hyaluronic acid", "glycerin", "niacinamide"],
    skinTypes: ["sensitive", "dry"],
    skinConcerns: ["sensitivity", "dryness"],
    isSustainable: true
  },
  {
    id: 2,
    name: "vitamin c brightening serum",
    brand: "skinceuticals",
    price: 39.99,
    rating: 4.8,
    description: "Intensive brightening serum with vitamin C and ferulic acid.",
    ingredient_list: ["l-ascorbic acid", "vitamin e", "ferulic acid", "water", "propylene glycol"],
    skinTypes: ["normal", "combination"],
    skinConcerns: ["hyperpigmentation", "aging"],
    isSustainable: false
  },
  {
    id: 3,
    name: "niacinamide oil control moisturizer",
    brand: "the ordinary",
    price: 29.99,
    rating: 4.3,
    description: "Lightweight moisturizer that controls oil without drying with niacinamide.",
    ingredient_list: ["niacinamide", "zinc oxide", "hyaluronic acid", "squalane", "water"],
    skinTypes: ["oily", "combination"],
    skinConcerns: ["acne", "oiliness"],
    isSustainable: true
  },
  {
    id: 4,
    name: "retinol anti-aging serum",
    brand: "neutrogena",
    price: 34.99,
    rating: 4.6,
    description: "Powerful anti-aging serum with retinol and peptides.",
    ingredient_list: ["retinol", "peptides", "vitamin e", "squalane", "dimethicone"],
    skinTypes: ["normal", "dry"],
    skinConcerns: ["aging", "fine lines"],
    isSustainable: false
  },
  {
    id: 5,
    name: "salicylic acid acne treatment",
    brand: "paula's choice",
    price: 32.00,
    rating: 4.7,
    description: "BHA liquid exfoliant that unclogs pores and reduces acne.",
    ingredient_list: ["salicylic acid", "green tea extract", "chamomile", "water", "butylene glycol"],
    skinTypes: ["oily", "combination"],
    skinConcerns: ["acne", "blackheads"],
    isSustainable: true
  },
  {
    id: 6,
    name: "hyaluronic acid hydrating serum",
    brand: "the inkey list",
    price: 19.99,
    rating: 4.4,
    description: "Multi-molecular weight hyaluronic acid for deep hydration.",
    ingredient_list: ["hyaluronic acid", "sodium hyaluronate", "glycerin", "water", "panthenol"],
    skinTypes: ["dry", "sensitive"],
    skinConcerns: ["dryness", "dehydration"],
    isSustainable: true
  },
  {
    id: 7,
    name: "gentle exfoliating toner",
    brand: "pixi",
    price: 28.00,
    rating: 4.2,
    description: "Gentle glycolic acid toner for smooth, radiant skin.",
    ingredient_list: ["glycolic acid", "aloe vera", "ginseng", "water", "witch hazel"],
    skinTypes: ["normal", "combination"],
    skinConcerns: ["dullness", "texture"],
    isSustainable: false
  },
  {
    id: 8,
    name: "ceramide repair moisturizer",
    brand: "cerave",
    price: 26.99,
    rating: 4.5,
    description: "Rich moisturizer with ceramides for barrier repair.",
    ingredient_list: ["ceramides", "cholesterol", "fatty acids", "hyaluronic acid", "dimethicone"],
    skinTypes: ["dry", "sensitive"],
    skinConcerns: ["dryness", "barrier damage"],
    isSustainable: true
  },
  {
    id: 9,
    name: "zinc sunscreen spf 50",
    brand: "eltamd",
    price: 41.00,
    rating: 4.8,
    description: "Broad spectrum mineral sunscreen with zinc oxide.",
    ingredient_list: ["zinc oxide", "titanium dioxide", "octinoxate", "water", "silica"],
    skinTypes: ["all"],
    skinConcerns: ["sun protection"],
    isSustainable: false
  },
  {
    id: 10,
    name: "peptide firming cream",
    brand: "olay",
    price: 37.99,
    rating: 4.3,
    description: "Anti-aging cream with peptides and amino acids.",
    ingredient_list: ["peptides", "amino acids", "niacinamide", "glycerin", "dimethicone"],
    skinTypes: ["normal", "dry"],
    skinConcerns: ["aging", "firmness"],
    isSustainable: false
  },
  {
    id: 11,
    name: "tea tree oil spot treatment",
    brand: "the body shop",
    price: 15.00,
    rating: 4.1,
    description: "Targeted acne treatment with tea tree oil.",
    ingredient_list: ["tea tree oil", "salicylic acid", "witch hazel", "alcohol", "water"],
    skinTypes: ["oily", "acne-prone"],
    skinConcerns: ["acne", "blemishes"],
    isSustainable: true
  },
  {
    id: 12,
    name: "rose hip oil facial oil",
    brand: "trilogy",
    price: 29.99,
    rating: 4.6,
    description: "Pure rosehip oil for hydration and anti-aging.",
    ingredient_list: ["rosehip seed oil", "vitamin e", "linoleic acid", "oleic acid", "palmitic acid"],
    skinTypes: ["dry", "mature"],
    skinConcerns: ["aging", "dryness"],
    isSustainable: true
  }
];

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

    console.error('Error adding to favorites:', err);
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

    console.error('Error removing from favorites:', err);
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
    const favoriteIds = Array.from(userFavorites.get(userId));
    const favoriteProducts = mockProducts.filter(product =>
      favoriteIds.includes(product.id.toString())
    );

    respond(res, favoriteProducts);
  } catch (err) {
    console.error('Error getting favorites:', err);
    error(res, 'Could not retrieve favorites');
  }
});


// GET /favorites/check/:productId - Check if product is favorited
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

    console.error('Error checking favorite status:', err);
    error(res, 'Could not check favorite status');
  }
});

module.exports = router;
