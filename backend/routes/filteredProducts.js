
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ProductFilterService = require('../services/productFilterService');

const productFilterService = new ProductFilterService({
  enableCache: true,
  logPerformance: process.env.NODE_ENV === 'development',
  cache: {
    defaultTTL: parseInt(process.env.CACHE_TTL) || 10 * 60 * 1000,
    maxSize: parseInt(process.env.CACHE_MAX_SIZE) || 100
  }
});

const logError = (location, err) => {
  const errorMsg = `Error in ${location}: ${err.message}`;
  if (process.env.NODE_ENV === 'development') {
    require('../utils/logger').error(errorMsg);
  }
  return errorMsg;
};

const respond = (res, data, status = 200) => res.status(status).json(data);
const error = (res, msg, status = 500) => res.status(status).json({ error: msg });

const isMongoConnected = () => mongoose.connection.readyState === 1;

let Product;
try {
  const models = require('../models');
  Product = models.Product;
} catch (err) {
  logError('Models import in filteredProducts.js', err);
}


router.get('/', async (req, res) => {
  try {
    const {
      skinType,
      skinConcern,
      isSustainable,
      isVegan,
      brand,
      minPrice,
      maxPrice,
      minRating,
      maxRating,
      product_type,
      product_category,
      selectedTags,
      sort,
      page = 1,
      limit = 10
    } = req.query;

    const filters = {
      skinType,
      skinConcern,
      isSustainable,
      isVegan,
      brand,
      minPrice,
      maxPrice,
      minRating,
      maxRating,
      product_type,
      product_category,
      selectedTags: selectedTags ?
        (Array.isArray(selectedTags) ? selectedTags : selectedTags.split(',')) :
        []
    };

    let sortCriteria = {};
    if (sort) {
      const [field, direction] = sort.split(':');
      if (field) {
        sortCriteria[field] = direction === 'desc' ? -1 : 1;
      }
    }

    let products = [];

    // Fetch from makeup API with direct filtering
    try {
      // Build the makeup API URL with query parameters
      let makeupApiUrl = 'https://makeup-api.herokuapp.com/api/v1/products.json?';
      const queryParams = new URLSearchParams();

      // Add product type filter if specified
      if (product_type) {
        queryParams.append('product_type', product_type);
      }

      // Add brand filter if specified
      if (brand) {
        queryParams.append('brand', brand);
      }

      // Add product category filter if specified
      if (product_category) {
        queryParams.append('product_category', product_category);
      }

      // Add price filter if specified
      if (minPrice) {
        queryParams.append('price_greater_than', minPrice);
      }

      if (maxPrice) {
        queryParams.append('price_less_than', maxPrice);
      }

      // Add rating filter if specified
      if (minRating) {
        queryParams.append('rating_greater_than', minRating);
      }

      if (maxRating) {
        queryParams.append('rating_less_than', maxRating);
      }

      // Fetch products from makeup API
      const response = await fetch(`${makeupApiUrl}${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error(`Makeup API responded with status: ${response.status}`);
      }

      const makeupData = await response.json();

      if (makeupData.length > 0) {
        // Transform makeup API data to match our format with enhanced properties
        products = makeupData.map(product => {
          // Extract tags from product
          const productTags = product.tag_list || [];

          return {
            id: product.id.toString(),
            name: product.name || '',
            brand: product.brand || '',
            price: product.price || '0.0',
            rating: product.rating || 0,
            description: product.description || '',
            ingredient_list: [], // Don't use tag_list as ingredients
            product_tags: productTags,
            product_type: product.product_type || '',
            product_category: product.category || '',
            product_colors: product.product_colors || [],
            // Determine if product is sustainable or vegan based on its tags
            isSustainable: productTags.some(tag =>
              ['EcoCert', 'Natural', 'Organic', 'Vegan'].includes(tag)
            ),
            isVegan: productTags.some(tag => tag === 'Vegan'),
            image_link: product.image_link || 'https://cdn.shopify.com/s/files/1/0593/2187/6633/collections/gua-sha-lady-placeholder_f387e950-9165-4436-99b7-cc7498ea2376.jpg?v=1638000265'
          };
        });
      }
    } catch (apiError) {
      // Fallback to database if API fails
      if (isMongoConnected() && Product) {
        products = await Product.find({}).lean();
      } else {
        return error(res, 'Could not fetch products from API or database', 503);
      }
    }

    const result = await productFilterService.filterAndSort(
      products,
      filters,
      sortCriteria,
      page,
      limit
    );

    respond(res, result);
  } catch (err) {
    logError('/api/filtered-products', err);
    error(res, 'Could not retrieve filtered products');
  }
});


router.get('/cache-stats', (_req, res) => {
  try {
    const stats = productFilterService.getCacheStats();
    respond(res, stats);
  } catch (err) {
    logError('/api/filtered-products/cache-stats', err);
    error(res, 'Could not retrieve cache statistics');
  }
});

router.get('/cache-policies', (_req, res) => {
  try {
    const policies = productFilterService.cache.POLICIES;
    respond(res, {
      policies: Object.values(policies),
      current: productFilterService.cache.config.evictionPolicy,
      descriptions: {
        lru: "Least Recently Used - Evicts items that haven't been accessed in the longest time",
        lfu: "Least Frequently Used - Evicts items that are accessed least often",
        fifo: "First In First Out - Evicts the oldest items first",
        custom: "Custom Weighted - Uses a combination of recency, frequency, and age"
      }
    });
  } catch (err) {
    logError('/api/filtered-products/cache-policies', err);
    error(res, 'Could not retrieve cache policies');
  }
});

router.post('/cache-policy', (req, res) => {
  try {
    const { policy, weights } = req.body;

    if (!policy) {
      return error(res, 'Policy is required', 400);
    }

    const success = productFilterService.cache.setEvictionPolicy(policy, { weights });

    if (success) {
      respond(res, {
        message: `Cache policy changed to ${policy.toUpperCase()}`,
        policy,
        weights: policy === 'custom' ? productFilterService.cache.config.weights : null
      });
    } else {
      error(res, `Invalid policy: ${policy}`, 400);
    }
  } catch (err) {
    logError('/api/filtered-products/cache-policy', err);
    error(res, 'Could not change cache policy');
  }
});


router.post('/clear-cache', (req, res) => {
  try {
    const { filters } = req.body;

    if (filters) {
      productFilterService.invalidateCache(filters);
      respond(res, { message: 'Cache entries matching filters invalidated' });
    } else {
      productFilterService.invalidateCache();
      respond(res, { message: 'Cache cleared successfully' });
    }
  } catch (err) {
    logError('/api/filtered-products/clear-cache', err);
    error(res, 'Could not clear cache');
  }
});

module.exports = router;
