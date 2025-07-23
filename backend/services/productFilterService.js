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

  normalizeFilters(filters = {}) {
    const normalized = {};

    // Original filters
    if (filters.skinType) {
      normalized.skinTypes = filters.skinType;
    }

    if (filters.skinConcern) {
      normalized.skinConcerns = filters.skinConcern;
    }

    if (filters.isSustainable === 'true' || filters.isSustainable === true) {
      normalized.isSustainable = true;
    }

    if (filters.isVegan === 'true' || filters.isVegan === true) {
      normalized.isVegan = true;
    }

    // Makeup API specific filters
    if (filters.product_type) {
      normalized.product_type = filters.product_type;
    }

    if (filters.product_category) {
      normalized.product_category = filters.product_category;
    }

    if (filters.brand) {
      normalized.brand = filters.brand;
    }

    // Price range filters
    if (filters.minPrice || filters.maxPrice) {
      normalized.price = {};
      if (filters.minPrice) {
        normalized.price.$gte = parseFloat(filters.minPrice);
      }
      if (filters.maxPrice) {
        normalized.price.$lte = parseFloat(filters.maxPrice);
      }
    }

    // Rating range filters
    if (filters.minRating || filters.maxRating) {
      normalized.rating = {};
      if (filters.minRating) {
        normalized.rating.$gte = parseFloat(filters.minRating);
      }
      if (filters.maxRating) {
        normalized.rating.$lte = parseFloat(filters.maxRating);
      }
    }

    // Product tags filter
    if (filters.selectedTags && Array.isArray(filters.selectedTags) && filters.selectedTags.length > 0) {
      normalized.product_tags = filters.selectedTags;
    } else if (filters.selectedTags && typeof filters.selectedTags === 'string') {
      // Handle case where tags come as a comma-separated string
      normalized.product_tags = filters.selectedTags.split(',').map(tag => tag.trim());
    }

    return normalized;
  }

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

  applyFilters(products, filters) {
    if (!products.length || !Object.keys(filters).length) {
      return products;
    }

    // Apply filters to products from makeup API

    return products.filter(product => {
      // Only apply filters that aren't already handled by the makeup API

      // Skin type and concern filters
      if (filters.skinTypes && !product.skinTypes?.includes(filters.skinTypes)) {
        return false;
      }

      if (filters.skinConcerns && !product.skinConcerns?.includes(filters.skinConcerns)) {
        return false;
      }

      // Sustainable and vegan filters
      if (filters.isSustainable && !product.isSustainable) {
        return false;
      }

      if (filters.isVegan && !product.isVegan) {
        return false;
      }

      // Product tags filter
      if (filters.product_tags && filters.product_tags.length > 0) {
        if (!product.product_tags || !Array.isArray(product.product_tags)) {
          return false;
        }

        const productTagsLower = product.product_tags.map(tag => tag.toLowerCase());
        const hasAllTags = filters.product_tags.every(tag =>
          productTagsLower.includes(tag.toLowerCase())
        );

        if (!hasAllTags) {
          return false;
        }
      }

      return true;
    });
  }

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

  getCacheStats() {
    return this.cache.getStats();
  }
}

module.exports = ProductFilterService;
