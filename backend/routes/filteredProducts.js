
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
      minRating
    };

    let sortCriteria = {};
    if (sort) {
      const [field, direction] = sort.split(':');
      if (field) {
        sortCriteria[field] = direction === 'desc' ? -1 : 1;
      }
    }

    let products;

    if (isMongoConnected() && Product) {
      products = await Product.find({}).lean();
    } else {
      return error(res, 'Database connection required for product filtering', 503);
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
