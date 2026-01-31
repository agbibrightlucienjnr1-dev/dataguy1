import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { AppError } from "./errorHandler.js";

/**
 * Create a rate limiter with custom configuration
 * @param {Object} options - Rate limiter options
 * @returns {Function} Express middleware
 */
const createRateLimiter = (options) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // limit each IP to 100 requests per windowMs
    message = "Too many requests from this IP, please try again later.",
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    standardHeaders = true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders = false, // Disable the `X-RateLimit-*` headers
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      error: "RATE_LIMIT_EXCEEDED",
    },
    standardHeaders,
    legacyHeaders,
    skipSuccessfulRequests,
    skipFailedRequests,
    // Use IP address for rate limiting with proper IPv6 support
    // ipKeyGenerator handles IPv6 addresses correctly and supports proxies
    keyGenerator: ipKeyGenerator,
    // Custom handler for rate limit exceeded
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message,
        error: "RATE_LIMIT_EXCEEDED",
        retryAfter: Math.ceil(options.windowMs / 1000), // seconds
      });
    },
  });
};

/**
 * Strict rate limiter for authentication endpoints
 * Prevents brute force attacks
 * 5 requests per 15 minutes per IP
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: "Too many login attempts. Please try again after 15 minutes.",
  skipSuccessfulRequests: false, // Count all requests, including successful ones
  skipFailedRequests: false,
});

/**
 * Moderate rate limiter for API endpoints
 * 100 requests per 15 minutes per IP
 */
export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: "Too many requests from this IP. Please try again later.",
});

/**
 * Lenient rate limiter for public endpoints
 * 200 requests per 15 minutes per IP
 */
export const publicRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window
  message: "Too many requests. Please slow down.",
});

/**
 * Strict rate limiter for payment/webhook endpoints
 * 50 requests per 15 minutes per IP
 */
export const paymentRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window
  message: "Too many payment requests. Please try again later.",
});

/**
 * Very strict rate limiter for admin endpoints
 * 30 requests per 15 minutes per IP
 */
export const adminRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per window
  message: "Too many admin requests. Please try again later.",
});

/**
 * Rate limiter for order creation (prevent abuse)
 * 20 orders per 15 minutes per IP
 */
export const orderCreationRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 orders per window
  message: "Too many order requests. Please try again later.",
  skipSuccessfulRequests: false,
});

/**
 * Rate limiter for withdrawal requests
 * 5 withdrawal requests per hour per IP
 */
export const withdrawalRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 withdrawal requests per hour
  message: "Too many withdrawal requests. Please try again after 1 hour.",
});

/**
 * Global rate limiter for all endpoints
 * Applied as a base layer
 * 1000 requests per 15 minutes per IP
 */
export const globalRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window (very high to catch only extreme abuse)
  message: "Too many requests. Your IP has been temporarily blocked.",
});
