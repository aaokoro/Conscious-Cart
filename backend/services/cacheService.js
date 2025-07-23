
// Cache service with LRU, LFU, FIFO, and custom weighted eviction policies
class CacheService {
  constructor(options = {}) {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      expirations: 0
    };

    this.POLICIES = {
      LRU: 'lru',
      LFU: 'lfu',
      FIFO: 'fifo',
      CUSTOM: 'custom'
    };

    this.config = {
      defaultTTL: options.defaultTTL || 10 * 60 * 1000,
      maxSize: options.maxSize || 100,
      cleanupInterval: options.cleanupInterval || 5 * 60 * 1000,
      evictionPolicy: options.evictionPolicy || this.POLICIES.LRU,
      weights: {
        recency: options.weights?.recency || 0.6,
        frequency: options.weights?.frequency || 0.3,
        age: options.weights?.age || 0.1
      }
    };

    if (!Object.values(this.POLICIES).includes(this.config.evictionPolicy)) {
      this.config.evictionPolicy = this.POLICIES.LRU;
    }

    this.startCleanupInterval();
  }

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

  get(key) {
    if (!this.cache.has(key)) {
      this.stats.misses++;
      return null;
    }

    const cacheItem = this.cache.get(key);
    const now = Date.now();

    if (now - cacheItem.createdAt > cacheItem.ttl) {
      this.cache.delete(key);
      this.stats.expirations++;
      this.stats.misses++;
      return null;
    }

    cacheItem.lastAccessed = now;
    cacheItem.accessCount++;
    this.cache.set(key, cacheItem);
    this.stats.hits++;

    return cacheItem.data;
  }

  set(key, data, ttl = this.config.defaultTTL) {
    if (this.cache.size >= this.config.maxSize) {
      this.evictItem();
    }

    const now = Date.now();
    this.cache.set(key, {
      data,
      createdAt: now,
      lastAccessed: now,
      accessCount: 0,
      ttl
    });
  }

  remove(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  evictItem() {
    if (this.cache.size === 0) return;

    let keyToEvict = null;

    switch (this.config.evictionPolicy) {
      case this.POLICIES.LRU:
        keyToEvict = this.findLRUKey();
        break;
      case this.POLICIES.LFU:
        keyToEvict = this.findLFUKey();
        break;
      case this.POLICIES.FIFO:
        keyToEvict = this.findOldestKey();
        break;
      case this.POLICIES.CUSTOM:
        keyToEvict = this.findCustomEvictionKey();
        break;
      default:
        keyToEvict = this.findLRUKey();
    }

    if (keyToEvict) {
      this.cache.delete(keyToEvict);
      this.stats.evictions++;
    }
  }

  findLRUKey() {
    let lruKey = null;
    let oldestAccessTime = Infinity;

    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestAccessTime) {
        oldestAccessTime = item.lastAccessed;
        lruKey = key;
      }
    }

    return lruKey;
  }

  findLFUKey() {
    let lfuKey = null;
    let lowestAccessCount = Infinity;
    let oldestCreationTime = Infinity;

    // Find minimum access count
    for (const [_, item] of this.cache.entries()) {
      if (item.accessCount < lowestAccessCount) {
        lowestAccessCount = item.accessCount;
      }
    }

    // Among items with lowest access count, find oldest
    for (const [key, item] of this.cache.entries()) {
      if (item.accessCount === lowestAccessCount && item.createdAt < oldestCreationTime) {
        oldestCreationTime = item.createdAt;
        lfuKey = key;
      }
    }

    return lfuKey;
  }

  findOldestKey() {
    let oldestKey = null;
    let oldestCreationTime = Infinity;

    for (const [key, item] of this.cache.entries()) {
      if (item.createdAt < oldestCreationTime) {
        oldestCreationTime = item.createdAt;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  findCustomEvictionKey() {
    const now = Date.now();
    let evictionKey = null;
    let highestScore = -Infinity;

    for (const [key, item] of this.cache.entries()) {
      // Higher score = more likely to be evicted
      const recencyScore = (now - item.lastAccessed) / this.config.defaultTTL;
      const frequencyScore = 1 / (item.accessCount + 1);
      const ageScore = (now - item.createdAt) / this.config.defaultTTL;

      const weightedScore =
        (recencyScore * this.config.weights.recency) +
        (frequencyScore * this.config.weights.frequency) +
        (ageScore * this.config.weights.age);

      if (weightedScore > highestScore) {
        highestScore = weightedScore;
        evictionKey = key;
      }
    }

    return evictionKey;
  }

  startCleanupInterval() {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, this.config.cleanupInterval);

    this.cleanupInterval.unref();
  }

  cleanupExpiredEntries() {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now - item.createdAt > item.ttl) {
        this.cache.delete(key);
        expiredCount++;
        this.stats.expirations++;
      }
    }

    // Removed console log for expired entries
  }

  stopCleanupInterval() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  setEvictionPolicy(policy, options = {}) {
    if (!Object.values(this.POLICIES).includes(policy)) {
      return false;
    }

    this.config.evictionPolicy = policy;

    if (policy === this.POLICIES.CUSTOM && options.weights) {
      this.config.weights = {
        ...this.config.weights,
        ...options.weights
      };
    }

    return true;
  }

  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      defaultTTL: this.config.defaultTTL,
      evictionPolicy: this.config.evictionPolicy,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: `${hitRate.toFixed(2)}%`,
      evictions: this.stats.evictions,
      expirations: this.stats.expirations,
      utilization: `${((this.cache.size / this.config.maxSize) * 100).toFixed(2)}%`,
      weights: this.config.evictionPolicy === this.POLICIES.CUSTOM ? this.config.weights : null
    };
  }

  has(key) {
    if (!this.cache.has(key)) {
      return false;
    }

    const { timestamp, ttl } = this.cache.get(key);
    const now = Date.now();

    return now - timestamp <= ttl;
  }

  invalidateByFilter(filterFn) {
    for (const key of this.cache.keys()) {
      if (filterFn(key)) {
        this.cache.delete(key);
      }
    }
  }

  invalidateByProductId(productId) {
    this.invalidateByFilter(key => key.includes(`productId:${productId}`));
  }
}

module.exports = CacheService;
