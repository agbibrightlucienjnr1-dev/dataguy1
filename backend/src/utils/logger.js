/**
 * Simple logging utility
 * Can be extended with proper logging library like Winston or Pino
 */

export const logger = {
  info: (message, meta = {}) => {
    console.log(`ℹ️ [INFO] ${message}`, meta);
  },

  error: (message, error = null) => {
    console.error(`❌ [ERROR] ${message}`);
    if (error) {
      console.error(error);
    }
  },

  warn: (message, meta = {}) => {
    console.warn(`⚠️ [WARN] ${message}`, meta);
  },

  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(`🐛 [DEBUG] ${message}`, meta);
    }
  },

  success: (message, meta = {}) => {
    console.log(`✅ [SUCCESS] ${message}`, meta);
  },
};
