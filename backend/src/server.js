import dotenv from "dotenv";

// Load environment variables FIRST before any other imports
dotenv.config();

import app from "./app.js";
import { initDatabase, closeDatabase } from "./config/database.js";
import { validateEnv } from "./config/env.js";
import { logger } from "./utils/logger.js";

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Global error handlers - MUST be set before any async operations
// Handle uncaught exceptions (synchronous errors)
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception - Fatal Error", {
    error: error.message,
    stack: error.stack,
  });

  // Attempt graceful shutdown
  gracefulShutdown("uncaughtException");
});

// Handle unhandled promise rejections (async errors)
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection - Fatal Error", {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });

  // Attempt graceful shutdown
  gracefulShutdown("unhandledRejection");
});

// Handle warnings
process.on("warning", (warning) => {
  logger.warn("Node.js Warning", {
    name: warning.name,
    message: warning.message,
    stack: warning.stack,
  });
});

let server = null;

// Start server only after database connection is established
const startServer = async () => {
  try {
    // Validate environment variables - fail fast if missing
    validateEnv();

    // Initialize database - fail fast if unavailable
    await initDatabase();

    server = app.listen(PORT, () => {
      logger.info("Server started successfully", {
        port: PORT,
        environment: NODE_ENV,
        healthCheck: `http://localhost:${PORT}/health`,
      });
    });

    // Handle server errors (e.g., port already in use)
    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        logger.error(`Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        logger.error("Server error", { error: error.message });
        throw error;
      }
    });

    return server;
  } catch (error) {
    logger.error("Failed to start server", {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1); // Exit with error code if startup fails
  }
};

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  logger.info("Graceful shutdown initiated", { signal });

  // Prevent new requests
  if (server) {
    server.close(async () => {
      logger.info("HTTP server closed");

      // Close database connections
      try {
        await closeDatabase();
        logger.info("Database connections closed");
      } catch (error) {
        logger.error("Error closing database", { error: error.message });
      }

      logger.info("Process terminated gracefully");
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      logger.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10000);
  } else {
    // If server wasn't started, just exit
    process.exit(0);
  }
};

// Handle termination signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Start the server
try {
  await startServer();
} catch (error) {
  logger.error("Fatal error during server startup", {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
}

export default server;
