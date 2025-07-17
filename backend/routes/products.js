const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const isMongoConnected = () => mongoose.connection.readyState === 1;

// Custom error logger
const logError = (location, err) => {
  // Replace console.error with a proper error logging mechanism
  // This could be integrated with a logging service in production
  const errorMsg = `Error in ${location}: ${err.message}`;
  // Log to a file, send to monitoring service, etc.
  return errorMsg;
};

let Product, Ingredient;
try {
  const models = require('../models');
  Product = models.Product;
  Ingredient = models.Ingredient;
} catch (err) {
  logError('Models import', err);
}

const EXTERNAL_API = {
  PRODUCTS: 'https://skincare-api.herokuapp.com/products',
  INGREDIENTS: 'https://skincare-api.herokuapp.com/ingredients'
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

async function fetchIngredientsFromAPI(limit = 20) {
  try {
    const response = await fetch(`${EXTERNAL_API.INGREDIENTS}?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    logError('fetchIngredientsFromAPI', err);
    return [];
  }
}

const respond = (res, data, status = 200) => res.status(status).json(data);
const error = (res, msg, status = 500) => res.status(status).json({ msg });

router.get('/', async (req, res) => {
  try {
    const { skinType, skinConcern, isSustainable, brand, minPrice, maxPrice, page = 1, limit = 10 } = req.query;
    const query = {};

    if (skinType) query.skinTypes = skinType;
    if (skinConcern) query.skinConcerns = skinConcern;
    if (isSustainable === 'true') query.isSustainable = true;
    if (brand) query.brand = brand;

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = minPrice;
      if (maxPrice) query.price.$lte = maxPrice;
    }

    if (isMongoConnected() && Product) {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const products = await Product.find(query)
        .sort({ rating: -1 })
        .limit(parseInt(limit))
        .skip(skip);

      const total = await Product.countDocuments(query);

      respond(res, {
        products,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } else {
      const allProducts = await fetchProductsFromAPI();
      respond(res, {
        products: allProducts,
        pagination: {
          total: allProducts.length,
          page: 1,
          limit: 10,
          pages: 1
        }
      });
    }
  } catch (err) {
    logError('/api/products', err);
    error(res, 'Could not retrieve products');
  }
});

router.get('/product', async (req, res) => {
  try {
    const { q: searchQuery, limit = 20, page = 1 } = req.query;
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);

    if (isMongoConnected() && Product) {
      if (!searchQuery) {
        const products = await Product.find({})
          .sort({ rating: -1 })
          .limit(limitNum);

        const formattedProducts = products.map(product => ({
          id: product._id,
          name: product.name,
          brand: product.brand,
          price: product.price,
          rating: product.rating,
          description: product.description,
          ingredient_list: product.ingredient_list,
          skinTypes: product.skinTypes,
          skinConcerns: product.skinConcerns,
          isSustainable: product.isSustainable
        }));

        return respond(res, formattedProducts);
      }

      const searchTerm = searchQuery.toLowerCase();
      const searchRegex = new RegExp(searchTerm, 'i');

      const products = await Product.find({
        $or: [
          { name: searchRegex },
          { brand: searchRegex },
          { "ingredient_list": searchRegex },
          { skinConcerns: { $in: [searchTerm] } },
          { skinTypes: { $in: [searchTerm] } }
        ]
      })
      .sort({ rating: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum);

      const formattedProducts = products.map(product => ({
        id: product._id,
        name: product.name,
        brand: product.brand,
        price: product.price,
        rating: product.rating,
        description: product.description,
        ingredient_list: product.ingredient_list,
        skinTypes: product.skinTypes,
        skinConcerns: product.skinConcerns,
        isSustainable: product.isSustainable
      }));

      respond(res, formattedProducts);
    } else {
      const allProducts = await fetchProductsFromAPI();

      if (!searchQuery) {
        return respond(res, allProducts.slice(0, limitNum));
      }

      const searchTerm = searchQuery.toLowerCase();
      const filteredProducts = allProducts.filter(product => {
        return (
          product.name.toLowerCase().includes(searchTerm) ||
          product.brand.toLowerCase().includes(searchTerm) ||
          (product.ingredient_list && product.ingredient_list.some(ingredient =>
            ingredient.toLowerCase().includes(searchTerm)
          )) ||
          (product.skinConcerns && product.skinConcerns.some(concern =>
            concern.toLowerCase().includes(searchTerm)
          )) ||
          (product.skinTypes && product.skinTypes.some(type =>
            type.toLowerCase().includes(searchTerm)
          ))
        );
      });

      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedResults = filteredProducts.slice(startIndex, endIndex);
      respond(res, paginatedResults);
    }
  } catch (err) {
    logError('/product search', err);
    error(res, 'Search failed');
  }
});

router.get('/ingredients', async (_req, res) => {
  try {
    if (isMongoConnected() && Ingredient) {
      const ingredients = await Ingredient.find({});
      respond(res, ingredients);
    } else {
      const ingredients = await fetchIngredientsFromAPI();
      respond(res, ingredients);
    }
  } catch (err) {
    logError('/ingredients', err);
    error(res, 'Could not retrieve ingredients');
  }
});

router.get('/ingredient', async (req, res) => {
  try {
    const { q: searchQuery, limit = 20 } = req.query;
    const limitNum = parseInt(limit);

    if (isMongoConnected() && Ingredient) {
      if (!searchQuery) {
        const ingredients = await Ingredient.find({}).limit(limitNum);
        return respond(res, ingredients);
      }

      const searchRegex = new RegExp(searchQuery.toLowerCase(), 'i');
      const ingredients = await Ingredient.find({
        $or: [
          { name: searchRegex },
          { benefits: { $in: [searchRegex] } },
          { category: searchRegex }
        ]
      }).limit(limitNum);

      respond(res, ingredients);
    } else {
      const allIngredients = await fetchIngredientsFromAPI();

      if (!searchQuery) {
        return respond(res, allIngredients.slice(0, limitNum));
      }

      const searchTerm = searchQuery.toLowerCase();
      const filteredIngredients = allIngredients.filter(ingredient => {
        return (
          ingredient.name.toLowerCase().includes(searchTerm) ||
          (ingredient.benefits && ingredient.benefits.some(benefit =>
            benefit.toLowerCase().includes(searchTerm)
          )) ||
          (ingredient.category && ingredient.category.toLowerCase().includes(searchTerm))
        );
      });

      respond(res, filteredIngredients.slice(0, limitNum));
    }
  } catch (err) {
    logError('/ingredient search', err);
    error(res, 'Ingredient search failed');
  }
});

router.get('/:id', async (req, res) => {
  try {
    const productId = req.params.id;

    if (isMongoConnected() && Product) {
      const product = await Product.findById(productId);
      if (!product) return error(res, 'Product not found', 404);
      respond(res, product);
    } else {
      const allProducts = await fetchProductsFromAPI();
      const product = allProducts.find(p => p.id === productId);

      if (!product) {
        return error(res, 'Product not found', 404);
      }

      respond(res, product);
    }
  } catch (err) {
    logError('/products/:id', err);
    error(res, 'Could not retrieve product');
  }
});

module.exports = router;
