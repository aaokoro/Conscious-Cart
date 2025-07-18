
class CacheService {
  constructor(options = {}) {
    this.cache = new Map();

    this.config = {
      defaultTTL: options.defaultTTL || 10 * 60 * 1000,
      maxSize: options.maxSize || 100,
      cleanupInterval: options.cleanupInterval || 5 * 60 * 1000,
    };

    this.startCleanupInterval();
  }

  /**
   * cache key from filter and sort parameters
   * @param {Object} filters
   * @param {Object} sort
   * @returns {String}
   */
  generateCacheKey(filters = {}, sort = {}) {
    const normalizedFilters = Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== null)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}:${value.sort().join(',')}`;
        }
        if (key === 'price' && typeof value === 'object') {
          return `price:${value.$gte || ''}:${value.$lte || ''}`;
        }
        return `${key}:${value}`;
      })
      .join('|');

    const normalizedSort = Object.entries(sort)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');

    return `${normalizedFilters}#${normalizedSort}`;
  }

  /**
   *
   * @param {String} key
   * @returns {Object|null}
   */
  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }

    const { data, timestamp, ttl } = this.cache.get(key);
    const now = Date.now();

    if (now - timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }

    return data;
  }

  /**
   * Store data in cache
   * @param {String} key
   * @param {Object} data
   * @param {Number} ttl
   */
  set(key, data, ttl = this.config.defaultTTL) {
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Remove an item from cache
   * @param {String} key
   * @returns {Boolean}
   */
  remove(key) {
    return this.cache.delete(key);
  }


  clear() {
    this.cache.clear();
  }

  /**
   *
   * @private
   */
  evictOldest() {
    let oldestKey = null;
    let oldestTimestamp = Infinity;


    for (const [key, { timestamp }] of this.cache.entries()) {
      if (timestamp < oldestTimestamp) {
        oldestTimestamp = timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * stating cleanup
   * @private
   */
  startCleanupInterval() {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, this.config.cleanupInterval);


    this.cleanupInterval.unref();
  }

  /**
   * Clean up expired cache entries
   * @private
   */
  cleanupExpiredEntries() {
    const now = Date.now();
    for (const [key, { timestamp, ttl }] of this.cache.entries()) {
      if (now - timestamp > ttl) {
        this.cache.delete(key);
      }
    }
  }


  stopCleanupInterval() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  /**
   *
   * @returns {Object} - Cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      defaultTTL: this.config.defaultTTL,
    };
  }

  /**
   * Check if a key exists in the cache and is not expired
   * @param {String} key
   * @returns {Boolean}
   */
  has(key) {
    if (!this.cache.has(key)) {
      return false;
    }

    const { timestamp, ttl } = this.cache.get(key);
    const now = Date.now();

    return now - timestamp <= ttl;
  }

  /**
   * Invalidate cache entries that match a filter function
   * @param {Function} filterFn
   */
  invalidateByFilter(filterFn) {
    for (const key of this.cache.keys()) {
      if (filterFn(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   *
   * @param {String} productId - Product ID
   */
  invalidateByProductId(productId) {
    this.invalidateByFilter(key => key.includes(`productId:${productId}`));
  }
}

module.exports = CacheService;
