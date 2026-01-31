/**
 * Global error handling middleware
 * Must be placed after all routes
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV === "development";

  // Log error details (always log, but with different detail levels)
  if (isDevelopment) {
    console.error("❌ Error:", {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
    });
  } else {
    // In production, log errors but don't expose details
    console.error("❌ Error:", {
      statusCode,
      url: req.originalUrl,
      method: req.method,
      // Only log message for non-500 errors (user errors)
      ...(statusCode < 500 && { message: err.message }),
    });
  }

  // Sanitize error messages in production for security
  // Don't expose internal error details to clients
  let clientMessage = err.message || "Internal Server Error";
  if (!isDevelopment && statusCode >= 500) {
    // For server errors in production, use generic message
    clientMessage = "An error occurred. Please try again later.";
  }

  // Send error response with message at top level for easier frontend access
  res.status(statusCode).json({
    success: false,
    message: clientMessage,
    error: {
      message: clientMessage,
      ...(isDevelopment && { stack: err.stack }),
    },
  });
};

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async handler wrapper to catch promise rejections
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
