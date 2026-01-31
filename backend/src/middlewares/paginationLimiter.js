import { AppError } from "./errorHandler.js";

/**
 * Middleware to enforce maximum pagination limits
 * Prevents excessive data retrieval that could cause memory issues
 */

const DEFAULT_MAX_LIMIT = 100;
const DEFAULT_DEFAULT_LIMIT = 20;

/**
 * Create pagination limiter middleware
 * @param {Object} options - Configuration options
 * @param {number} options.maxLimit - Maximum allowed limit (default: 100)
 * @param {number} options.defaultLimit - Default limit if not provided (default: 20)
 * @returns {Function} Express middleware
 */
export const paginationLimiter = (options = {}) => {
  const maxLimit = options.maxLimit || DEFAULT_MAX_LIMIT;
  const defaultLimit = options.defaultLimit || DEFAULT_DEFAULT_LIMIT;

  return (req, res, next) => {
    // Get page and limit from query
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || defaultLimit;

    // Validate page
    if (page < 1) {
      page = 1;
    }

    // Enforce maximum limit
    if (limit > maxLimit) {
      limit = maxLimit;
    }

    if (limit < 1) {
      limit = defaultLimit;
    }

    // Add validated values to request
    req.pagination = {
      page,
      limit,
      skip: (page - 1) * limit,
    };

    // Override query params with validated values
    req.query.page = page;
    req.query.limit = limit;

    next();
  };
};

/**
 * Strict pagination limiter for admin endpoints
 * Allows higher limits for admin users
 */
export const adminPaginationLimiter = paginationLimiter({
  maxLimit: 200,
  defaultLimit: 50,
});

/**
 * Standard pagination limiter for regular endpoints
 */
export const standardPaginationLimiter = paginationLimiter({
  maxLimit: 100,
  defaultLimit: 20,
});
