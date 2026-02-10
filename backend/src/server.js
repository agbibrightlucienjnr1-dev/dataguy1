import dotenv from "dotenv";

// Load environment variables FIRST before any other imports
dotenv.config();

import app from "./app.js";
import { initDatabase, closeDatabase } from "./config/database.js";
import { validateEnv } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { verifyAllPendingPayments } from "./services/paymentVerificationService.js";

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Payment verification interval (default: 2 minutes)
const VERIFICATION_INTERVAL_MS = parseInt(
  process.env.PAYMENT_VERIFICATION_INTERVAL_MS || "120000",
  10,
);
let verificationIntervalId = null;

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

    // Auto-seed admin user if enabled or in production
    // This ensures admin exists on first deployment without needing shell access
    if (process.env.AUTO_SEED_ADMIN === "true" || NODE_ENV === "production") {
      try {
        const { seedAdmin } = await import("./seedAdmin.js");
        await seedAdmin();
      } catch (seedError) {
        // Log but don't fail startup if seeding fails (admin might already exist)
        logger.warn("Admin seeding failed (non-critical)", {
          error: seedError.message,
        });
      }
    }

    server = app.listen(PORT, () => {
      logger.info("Server started successfully", {
        port: PORT,
        environment: NODE_ENV,
        healthCheck: `http://localhost:${PORT}/health`,
      });

      // Start background payment verification
      startPaymentVerificationInterval();
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

/**
 * Start background payment verification interval
 * This periodically checks for pending orders and verifies their payment status
 */
const startPaymentVerificationInterval = () => {
  if (VERIFICATION_INTERVAL_MS <= 0) {
    logger.info("Background payment verification disabled");
    return;
  }

  logger.info("Starting background payment verification", {
    intervalMs: VERIFICATION_INTERVAL_MS,
    intervalMinutes: VERIFICATION_INTERVAL_MS / 60000,
  });

  // Run verification periodically
  verificationIntervalId = setInterval(async () => {
    try {
      const result = await verifyAllPendingPayments({
        minAgeMinutes: 1, // Only check orders at least 1 minute old
        maxAgeHours: 24, // Don't check orders older than 24 hours
        limit: 20, // Check up to 20 orders per interval
      });

      if (result.confirmed > 0) {
        logger.success("Background verification confirmed payments", {
          confirmed: result.confirmed,
          checked: result.checked,
        });
      } else if (result.checked > 0) {
        logger.info("Background verification completed", {
          checked: result.checked,
          notPaid: result.notPaid,
        });
      }
    } catch (error) {
      logger.error("Background payment verification error", {
        error: error.message,
      });
    }
  }, VERIFICATION_INTERVAL_MS);

  // Run initial verification after 30 seconds (give server time to fully start)
  setTimeout(async () => {
    try {
      logger.info("Running initial payment verification");
      await verifyAllPendingPayments({
        minAgeMinutes: 1,
        maxAgeHours: 24,
        limit: 50,
      });
    } catch (error) {
      logger.error("Initial payment verification error", {
        error: error.message,
      });
    }
  }, 30000);
};

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  logger.info("Graceful shutdown initiated", { signal });

  // Clear background verification interval
  if (verificationIntervalId) {
    clearInterval(verificationIntervalId);
    logger.info("Background payment verification stopped");
  }

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
