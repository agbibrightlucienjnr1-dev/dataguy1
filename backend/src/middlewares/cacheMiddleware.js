import cache from "../utils/cache.js";
import { logger } from "../utils/logger.js";
import { asyncHandler } from "./errorHandler.js";

/**
 * Cache middleware for Express routes
 * Caches response data to reduce database load
 */

/**
 * Create cache middleware
 * @param {Object} options - Cache options
 * @param {number} options.ttl - Time to live in milliseconds (default: 5 minutes)
 * @param {Function} options.keyGenerator - Function to generate cache key from request (optional)
 * @param {Function} options.shouldCache - Function to determine if response should be cached (optional)
 * @returns {Function} Express middleware
 */
export const cacheMiddleware = (options = {}) => {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes default
    keyGenerator = (req) => {
      // Default key generator: method + path + query params
      const queryString = new URLSearchParams(req.query).toString();
      return `${req.method}:${req.path}${queryString ? `?${queryString}` : ""}`;
    },
    shouldCache = (req, res) => {
      // Only cache GET requests with 200 status
      return req.method === "GET" && res.statusCode === 200;
    },
  } = options;

  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    // Generate cache key
    const cacheKey = keyGenerator(req);

    // Try to get from cache
    const cached = cache.get(cacheKey);
    if (cached) {
      logger.debug("Cache hit", { key: cacheKey });
      res.setHeader("X-Cache", "HIT");
      return res.json(cached);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache response
    res.json = function (data) {
      // Only cache if shouldCache returns true
      if (shouldCache(req, res)) {
        try {
          cache.set(cacheKey, data, ttl);
          logger.debug("Cache set", { key: cacheKey, ttl });
          res.setHeader("X-Cache", "MISS");
        } catch (error) {
          logger.warn("Failed to cache response", { error: error.message });
        }
      }

      // Call original json method
      return originalJson(data);
    };

    next();
  };
};

/**
 * Cache middleware for specific routes with custom TTL
 * @param {number} ttl - Time to live in milliseconds
 * @returns {Function} Express middleware
 */
export const cacheFor = (ttl) => cacheMiddleware({ ttl });

/**
 * Invalidate cache by pattern
 * @param {string} pattern - Pattern to match keys (supports wildcards)
 * @returns {number} Number of keys invalidated
 */
export const invalidateCache = (pattern) => {
  const cacheStore = cache.store;
  let invalidated = 0;

  // Simple pattern matching (supports * wildcard)
  const regex = new RegExp(
    pattern.replace(/\*/g, ".*").replace(/\?/g, "."),
  );

  cacheStore.forEach((_, key) => {
    if (regex.test(key)) {
      cache.delete(key);
      invalidated++;
    }
  });

  logger.info("Cache invalidated", { pattern, count: invalidated });
  return invalidated;
};

/**
 * Clear all cache
 */
export const clearCache = () => {
  cache.clear();
  logger.info("Cache cleared");
};

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
export const getCacheStats = () => {
  return cache.getStats();
};

/**
 * Express middleware to get cache stats
 */
export const getCacheStatsMiddleware = asyncHandler(async (req, res) => {
  const stats = getCacheStats();
  res.status(200).json({
    success: true,
    ...stats,
  });
});

/**
 * Express middleware to clear cache
 */
export const clearCacheMiddleware = asyncHandler(async (req, res) => {
  clearCache();
  res.status(200).json({
    success: true,
    message: "Cache cleared successfully",
  });
});
