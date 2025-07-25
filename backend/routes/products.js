const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const fetch = require('node-fetch');
const { EXTERNAL_API_CONFIG } = require('../config/constants');

const isMongoConnected = () => mongoose.connection.readyState === 1;

const logError = (location, err) => {
  return `Error in ${location}: ${err.message}`;
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
  try {
    const response = await fetch(`${EXTERNAL_API_CONFIG.SKINCARE_API_PRODUCTS}?limit=${limit}`);
    if (!response.ok) throw new Error(`Primary API responded with status: ${response.status}`);

    const products = await response.json();

    return products.map(product => ({
      id: product.id?.toString() || '',
      name: product.name || 'Unknown Product',
      brand: product.brand || 'Unknown Brand',
      price: '0.0',
      rating: 4.0,
      description: 'A skincare product with carefully selected ingredients',
      ingredient_list: product.ingredient_list || [],
      skinTypes: ['All'],
      skinConcerns: ['General'],
      isSustainable: false,
      image_link: product.image_link || 'https://via.placeholder.com/150'
    }));
  } catch (primaryErr) {
    try {
      const productTypes = ['foundation', 'blush', 'lipstick', 'mascara', 'eyeshadow'];
      const productsPerType = Math.ceil(limit / productTypes.length);

      const productPromises = productTypes.map(type =>
        fetch(`${EXTERNAL_API_CONFIG.MAKEUP_API_PRODUCTS}?product_type=${type}&limit=${productsPerType}`)
          .then(res => res.ok ? res.json() : [])
          .catch(() => [])
      );

      const productResults = await Promise.all(productPromises);
      const backupProducts = productResults.flat().slice(0, limit);

      return backupProducts.map(product => ({
        id: product.id?.toString() || '',
        name: product.name || 'Unknown Product',
        brand: product.brand || 'Unknown Brand',
        price: product.price || '0.0',
        rating: product.rating || 4.0,
        description: product.description || 'No description available',
        ingredient_list: product.tag_list || ['Water', 'Glycerin'],
        product_tags: product.tag_list || [],
        product_type: product.product_type || 'skincare',
        product_colors: product.product_colors || [],
        skinTypes: ['All'],
        skinConcerns: ['General'],
        isSustainable: false,
        image_link: product.image_link || `https://via.placeholder.com/150?text=${encodeURIComponent(product.name)}`
      }));
    } catch (backupErr) {
      return [];
    }
  }
}

async function fetchIngredientsFromAPI(limit = 20) {
  try {
    const response = await fetch(`${EXTERNAL_API_CONFIG.SKINCARE_API_INGREDIENTS}?limit=${limit}`);
    if (!response.ok) throw new Error(`Primary API responded with status: ${response.status}`);

    const ingredients = await response.json();

    return ingredients.map(item => ({
      id: item.id?.toString() || '',
      name: item.ingredient,
      benefits: [],
      category: 'skincare'
    }));
  } catch (primaryErr) {
    try {
      const backupResponse = await fetch(`${EXTERNAL_API_CONFIG.MAKEUP_API_PRODUCTS}?product_type=${EXTERNAL_API_CONFIG.MAKEUP_API_PRODUCT_TYPE}`);
      if (!backupResponse.ok) throw new Error(`Backup API responded with status: ${backupResponse.status}`);

      const products = await backupResponse.json();
      const uniqueIngredients = new Set();
      const ingredientsList = [];

      products.forEach(product => {
        if (Array.isArray(product.tag_list)) {
          product.tag_list.forEach(tag => {
            if (!uniqueIngredients.has(tag)) {
              uniqueIngredients.add(tag);
              ingredientsList.push({
                id: (ingredientsList.length + 1).toString(),
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
      return [];
    }
  }
}

const respond = (res, data, status = 200) => res.status(status).json(data);
const error = (res, msg, status = 500) => res.status(status).json({ msg });

router.get('/populate', async (req, res) => {
  if (!isMongoConnected()) return error(res, 'MongoDB not connected');

  const [products, ingredients] = await Promise.all([
    fetchProductsFromAPI(25),
    fetchIngredientsFromAPI(20)
  ]);

  try {
    const insertedProducts = await Product.insertMany(products, { ordered: false });
    const insertedIngredients = await Ingredient.insertMany(ingredients, { ordered: false });
    respond(res, {
      products: insertedProducts.length,
      ingredients: insertedIngredients.length
    });
  } catch (err) {
    error(res, 'Population failed');
  }
});

router.get('/products', async (req, res) => {
  if (!isMongoConnected()) return error(res, 'MongoDB not connected');

  try {
    const products = await Product.find({});
    respond(res, products);
  } catch (err) {
    error(res, 'Could not fetch products');
  }
});

router.get('/ingredients', async (req, res) => {
  if (!isMongoConnected()) return error(res, 'MongoDB not connected');

  try {
    const ingredients = await Ingredient.find({});
    respond(res, ingredients);
  } catch (err) {
    error(res, 'Could not fetch ingredients');
  }
});

router.get('/product/:id', async (req, res) => {
  if (!isMongoConnected()) return error(res, 'MongoDB not connected');

  try {
    const product = await Product.findById(req.params.id);
    if (!product) return error(res, 'Product not found', 404);
    respond(res, product);
  } catch (err) {
    error(res, 'Could not fetch product');
  }
});

router.get('/ingredient/:id', async (req, res) => {
  if (!isMongoConnected()) return error(res, 'MongoDB not connected');

  try {
    const ingredient = await Ingredient.findById(req.params.id);
    if (!ingredient) return error(res, 'Ingredient not found', 404);
    respond(res, ingredient);
  } catch (err) {
    error(res, 'Could not fetch ingredient');
  }
});

module.exports = router;