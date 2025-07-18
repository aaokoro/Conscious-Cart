const CacheService = require('./cacheService');

class ProductFilterService {
  constructor(options = {}) {
    this.cache = new CacheService(options.cache);

    this.config = {
      defaultLimit: options.defaultLimit || 10,
      defaultPage: options.defaultPage || 1,
      maxLimit: options.maxLimit || 100,
      enableCache: options.enableCache !== false,
      logPerformance: options.logPerformance || false,
    };
  }

  /**
   * Filter and sort products based on criteria
   * @param {Array} products
   * @param {Object} filters
   * @param {Object} sort
   * @param {Number} page
   * @param {Number} limit
   * @returns {Object}
   */
  async filterAndSort(products, filters = {}, sort = {}, page = this.config.defaultPage, limit = this.config.defaultLimit) {
    const normalizedFilters = this.normalizeFilters(filters);
    const normalizedSort = this.normalizeSort(sort);
    const normalizedPage = Math.max(1, parseInt(page) || this.config.defaultPage);
    const normalizedLimit = Math.min(
      this.config.maxLimit,
      Math.max(1, parseInt(limit) || this.config.defaultLimit)
    );

    const startTime = this.config.logPerformance ? Date.now() : null;

    const cacheKey = this.cache.generateCacheKey(normalizedFilters, normalizedSort);

    if (this.config.enableCache) {
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
        const paginatedResult = this.paginateResults(cachedResult, normalizedPage, normalizedLimit);

        if (this.config.logPerformance) {
          const endTime = Date.now();
          const duration = endTime - startTime;
          require('../utils/logger').info(`[ProductFilterService] Cache hit! Time: ${duration}ms`);
        }

        return paginatedResult;
      }
    }

    let filteredProducts = [...products];
    filteredProducts = this.applyFilters(filteredProducts, normalizedFilters);

    filteredProducts = this.applySort(filteredProducts, normalizedSort);

    if (this.config.enableCache) {
      this.cache.set(cacheKey, filteredProducts);
    }

    const result = this.paginateResults(filteredProducts, normalizedPage, normalizedLimit);

    if (this.config.logPerformance) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      require('../utils/logger').info(`[ProductFilterService] Cache miss. Time: ${duration}ms`);
    }

    return result;
  }

  /**
   * Normalize filter parameters
   * @param {Object} filters
   * @returns {Object}
   */
  normalizeFilters(filters = {}) {
    const normalized = {};

    if (filters.skinType) {
      normalized.skinTypes = filters.skinType;
    }

    if (filters.skinConcern) {
      normalized.skinConcerns = filters.skinConcern;
    }

    if (filters.isSustainable === 'true' || filters.isSustainable === true) {
      normalized.isSustainable = true;
    }

    if (filters.brand) {
      normalized.brand = filters.brand;
    }

    if (filters.minPrice || filters.maxPrice) {
      normalized.price = {};
      if (filters.minPrice) {
        normalized.price.$gte = parseFloat(filters.minPrice);
      }
      if (filters.maxPrice) {
        normalized.price.$lte = parseFloat(filters.maxPrice);
      }
    }

    if (filters.minRating) {
      normalized.rating = { $gte: parseFloat(filters.minRating) };
    }

    if (filters.isVegan === 'true' || filters.isVegan === true) {
      normalized.isVegan = true;
    }

    return normalized;
  }

  /**
   *  sort parameters
   * @param {Object|String} sort
   * @returns {Object}
   */
  normalizeSort(sort = {}) {
    const defaultSort = { rating: -1 };

    if (typeof sort === 'string') {
      const [field, direction] = sort.split(':');
      if (field) {
        return { [field]: direction === 'desc' ? -1 : 1 };
      }
      return defaultSort;
    }

    if (typeof sort === 'object' && Object.keys(sort).length > 0) {
      return sort;
    }

    return defaultSort;
  }

  /**
   * Apply filters to products
   * @param {Array} products
   * @param {Object} filters
   * @returns {Array}
   */
  applyFilters(products, filters) {
    return products.filter(product => {
      if (filters.skinTypes && !product.skinTypes?.includes(filters.skinTypes)) {
        return false;
      }

      if (filters.skinConcerns && !product.skinConcerns?.includes(filters.skinConcerns)) {
        return false;
      }

      if (filters.isSustainable && !product.isSustainable) {
        return false;
      }

      if (filters.isVegan && !product.isVegan) {
        return false;
      }

      if (filters.brand && product.brand !== filters.brand) {
        return false;
      }

      if (filters.price) {
        if (filters.price.$gte !== undefined && product.price < filters.price.$gte) {
          return false;
        }
        if (filters.price.$lte !== undefined && product.price > filters.price.$lte) {
          return false;
        }
      }

      if (filters.rating && filters.rating.$gte !== undefined && product.rating < filters.rating.$gte) {
        return false;
      }

      return true;
    });
  }

  /**
   * Apply sorting to products
   * @param {Array} products
   * @param {Object} sort
   * @returns {Array}
   */
  applySort(products, sort) {
    const sortEntries = Object.entries(sort);
    if (sortEntries.length === 0) {
      return products;
    }

    return [...products].sort((a, b) => {
      for (const [field, direction] of sortEntries) {
        if (a[field] < b[field]) {
          return direction === 1 ? -1 : 1;
        }
        if (a[field] > b[field]) {
          return direction === 1 ? 1 : -1;
        }
      }
      return 0;
    });
  }

  /**
   * Apply pagination to results
   * @param {Array} products
   * @param {Number} page
   * @param {Number} limit
   * @returns {Object}
   */
  paginateResults(products, page, limit) {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = products.slice(startIndex, endIndex);

    return {
      products: paginatedProducts,
      pagination: {
        total: products.length,
        page,
        limit,
        pages: Math.ceil(products.length / limit)
      }
    };
  }

  /**
   *
   * @param {Object} filters - Filter criteria to invalidate
   */
  invalidateCache(filters = {}) {
    if (!this.config.enableCache) {
      return;
    }

    if (Object.keys(filters).length === 0) {
      this.cache.clear();
      return;
    }

    const partialKey = Object.entries(filters)
      .map(([key, value]) => `${key}:${value}`)
      .join('|');

    this.cache.invalidateByFilter(key => key.includes(partialKey));
  }

  /**
   *  cache statistics
   * @returns {Object}
   */
  getCacheStats() {
    return this.cache.getStats();
  }
}

module.exports = ProductFilterService;
