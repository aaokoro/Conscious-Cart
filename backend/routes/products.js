const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const fetch = require('node-fetch');
const { EXTERNAL_API_CONFIG } = require('../config/constants');

const isMongoConnected = () => mongoose.connection.readyState === 1;


const logError = (location, err) => {
  const errorMsg = `Error in ${location}: ${err.message}`;
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



async function fetchProductsFromAPI(limit = 20) {
  // Try primary API (skincare-api)
  try {
    const response = await fetch(`${EXTERNAL_API_CONFIG.SKINCARE_API_PRODUCTS}?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`Primary API responded with status: ${response.status}`);
    }

    const products = await response.json();

    return products.map(product => ({
      id: product.id.toString(),
      name: product.name || 'Unknown Product',
      brand: product.brand || 'Unknown Brand',
      price: '0.0',
      rating: 4.0,
      description: 'A skincare product with carefully selected ingredients',
      ingredient_list: product.ingredient_list || [],
      skinTypes: ['All'],
      skinConcerns: ['General'],
      isSustainable: false,
      image_link: `https://via.placeholder.com/150?text=${encodeURIComponent(product.name)}`
    }));
  } catch (primaryErr) {
    // If primary API fails, try backup API (makeup-api)
    try {
      const backupResponse = await fetch(`${EXTERNAL_API_CONFIG.MAKEUP_API_PRODUCTS}?product_type=${EXTERNAL_API_CONFIG.MAKEUP_API_PRODUCT_TYPE}`);
      if (!backupResponse.ok) {
        throw new Error(`Backup API responded with status: ${backupResponse.status}`);
      }

      const backupProducts = await backupResponse.json();

      // Transform makeup API format to our application format
      return backupProducts.slice(0, limit).map(product => ({
        id: product.id.toString(),
        name: product.name || 'Unknown Product',
        brand: product.brand || 'Unknown Brand',
        price: product.price || '0.0',
        rating: product.rating || 4.0,
        description: product.description || 'No description available',
        ingredient_list: product.tag_list || ['Water', 'Glycerin'],
        skinTypes: ['All'],
        skinConcerns: ['General'],
        isSustainable: false,
        image_link: product.image_link || `https://via.placeholder.com/150?text=${encodeURIComponent(product.name)}`
      }));
    } catch (backupErr) {
      // If both APIs fail, return empty array
      logError('fetchProductsFromAPI', `Primary API error: ${primaryErr.message}, Backup API error: ${backupErr.message}`);
      return [];
    }
  }
}

async function fetchIngredientsFromAPI(limit = 20) {
  try {
    const response = await fetch(`${EXTERNAL_API_CONFIG.SKINCARE_API_INGREDIENTS}?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`Primary API responded with status: ${response.status}`);
    }

    const ingredients = await response.json();

    return ingredients.map(item => ({
      id: item.id.toString(),
      name: item.ingredient,
      benefits: [],
      category: 'skincare'
    }));
  } catch (primaryErr) {
    try {
      const backupResponse = await fetch(`${EXTERNAL_API_CONFIG.MAKEUP_API_PRODUCTS}?product_type=${EXTERNAL_API_CONFIG.MAKEUP_API_PRODUCT_TYPE}`);
      if (!backupResponse.ok) {
        throw new Error(`Backup API responded with status: ${backupResponse.status}`);
      }

      const products = await backupResponse.json();

      const uniqueIngredients = new Set();
      const ingredientsList = [];

      products.forEach(product => {
        if (product.tag_list && Array.isArray(product.tag_list)) {
          product.tag_list.forEach(tag => {
            if (!uniqueIngredients.has(tag)) {
              uniqueIngredients.add(tag);
              ingredientsList.push({
                id: ingredientsList.length + 1,
                name: tag,
                benefits: [],
                category: 'makeup'
              });
            }
          });
        }
      });

      return ingredientsList.slice(0, limit);
    } catch (backupErr) {
      
      logError('fetchIngredientsFromAPI', `Primary API error: ${primaryErr.message}, Backup API error: ${backupErr.message}`);
      return [];
    }
  }
}

const respond = (res, data, status = 200) => res.status(status).json(data);
const error = (res, msg, status = 500) => res.status(status).json({ msg });

router.get('/api/products', async (req, res) => {
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

router.get('/api/products/:id', async (req, res) => {
  try {
    if (isMongoConnected() && Product) {
      const product = await Product.findById(req.params.id);
      if (!product) return error(res, 'Product not found', 404);
      respond(res, product);
    } else {
      const allProducts = await fetchProductsFromAPI();
      const product = allProducts.find(p => p.id === req.params.id);
      if (!product) return error(res, 'Product not found', 404);
      respond(res, product);
    }
  } catch (err) {
    logError('/api/products/:id', err);
    error(res, 'Could not retrieve product');
  }
});

router.get('/products', async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);

    if (isMongoConnected() && Product) {
      const skip = (pageNum - 1) * limitNum;
      const products = await Product.find({})
        .sort({ rating: -1 })
        .limit(limitNum)
        .skip(skip);

      const formattedProducts = products.map(product => ({
        id: product._id,
        name: product.name,
        brand: product.brand,
        price: product.price,
        rating: product.rating,
        description: product.description,
        ingredient_list: product.ingredients,
        skinTypes: product.skinTypes,
        skinConcerns: product.skinConcerns,
        isSustainable: product.isSustainable
      }));

      respond(res, formattedProducts);
    } else {
      const allProducts = await fetchProductsFromAPI();
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedProducts = allProducts.slice(startIndex, endIndex);
      respond(res, paginatedProducts);
    }
  } catch (err) {
    logError('/products', err);
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
          ingredient_list: product.ingredients,
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
          { ingredients: { $in: [searchRegex] } },
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
        ingredient_list: product.ingredients,
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

router.get('/products/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);

    if (isMongoConnected() && Product) {
      const product = await Product.findOne({ id: productId });
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

module.exports = router;
