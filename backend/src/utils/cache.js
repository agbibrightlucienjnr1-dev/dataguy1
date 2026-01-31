/**
 * Simple in-memory cache implementation
 * Can be upgraded to Redis for distributed caching later
 */

class Cache {
  constructor() {
    this.store = new Map();
    this.timers = new Map();
  }

  /**
   * Set a value in cache with optional TTL (time to live)
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds (optional)
   * @returns {boolean} Success status
   */
  set(key, value, ttl = null) {
    try {
      // Remove existing timer if any
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key));
        this.timers.delete(key);
      }

      // Store the value
      this.store.set(key, {
        value,
        timestamp: Date.now(),
        ttl,
      });

      // Set expiration timer if TTL provided
      if (ttl && ttl > 0) {
        const timer = setTimeout(() => {
          this.delete(key);
        }, ttl);
        this.timers.set(key, timer);
      }

      return true;
    } catch (error) {
      console.error("Cache set error:", error);
      return false;
    }
  }

  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {*} Cached value or null if not found/expired
   */
  get(key) {
    const item = this.store.get(key);

    if (!item) {
      return null;
    }

    // Check if expired
    if (item.ttl && Date.now() - item.timestamp > item.ttl) {
      this.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * Check if a key exists in cache
   * @param {string} key - Cache key
   * @returns {boolean} True if key exists and is not expired
   */
  has(key) {
    const item = this.store.get(key);
    if (!item) {
      return false;
    }

    // Check if expired
    if (item.ttl && Date.now() - item.timestamp > item.ttl) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a key from cache
   * @param {string} key - Cache key
   * @returns {boolean} True if key was deleted
   */
  delete(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    return this.store.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear() {
    // Clear all timers
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
    this.store.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getStats() {
    let expired = 0;
    let active = 0;

    const now = Date.now();
    this.store.forEach((item) => {
      if (item.ttl && now - item.timestamp > item.ttl) {
        expired++;
      } else {
        active++;
      }
    });

    return {
      total: this.store.size,
      active,
      expired,
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  /**
   * Estimate memory usage (rough calculation)
   * @returns {string} Estimated memory usage
   */
  estimateMemoryUsage() {
    let size = 0;
    this.store.forEach((item) => {
      try {
        size += JSON.stringify(item).length * 2; // Rough estimate (2 bytes per char)
      } catch (e) {
        // Skip items that can't be serialized
      }
    });
    return `${(size / 1024 / 1024).toFixed(2)} MB`;
  }

  /**
   * Clean up expired entries
   * @returns {number} Number of entries cleaned
   */
  cleanup() {
    let cleaned = 0;
    const now = Date.now();

    this.store.forEach((item, key) => {
      if (item.ttl && now - item.timestamp > item.ttl) {
        this.delete(key);
        cleaned++;
      }
    });

    return cleaned;
  }
}

// Create singleton instance
const cache = new Cache();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  cache.cleanup();
}, 5 * 60 * 1000);

export default cache;
