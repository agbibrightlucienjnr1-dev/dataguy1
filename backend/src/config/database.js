import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { logger } from "../utils/logger.js";

let prisma = null;
let pool = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 5000; // 5 seconds

/**
 * Initialize Prisma Client with error handling and reconnection logic
 * Fails fast if database connection is unavailable
 */
export const initDatabase = async () => {
  if (prisma) {
    return prisma;
  }

  try {
    // Create PostgreSQL connection pool with limits to prevent exhaustion
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      max: parseInt(process.env.DB_POOL_MAX || "20", 10), // Maximum pool size
      idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || "30000", 10), // 30 seconds
      connectionTimeoutMillis: parseInt(
        process.env.DB_POOL_CONNECTION_TIMEOUT || "2000",
        10,
      ), // 2 seconds
      // Retry connection on failure
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    });

    // Handle pool errors
    pool.on("error", (err) => {
      logger.error("Database pool error", {
        error: err.message,
        code: err.code,
      });

      // Attempt reconnection if connection is lost
      if (err.code === "ECONNREFUSED" || err.code === "ETIMEDOUT") {
        handleDatabaseReconnection();
      }
    });

    // Create Prisma adapter
    const adapter = new PrismaPg(pool);

    // Create Prisma Client with adapter
    prisma = new PrismaClient({
      adapter,
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "info", "warn", "error"]
          : ["error"],
      errorFormat: "pretty",
    });

    // Test database connection - fail fast if unavailable
    await prisma.$connect();
    logger.info("Database connected successfully");
    reconnectAttempts = 0; // Reset on successful connection

    return prisma;
  } catch (error) {
    logger.error("Failed to connect to database", {
      error: error.message,
      code: error.code,
    });

    // Retry connection if it's a connection error
    if (
      (error.code === "ECONNREFUSED" ||
        error.code === "ETIMEDOUT" ||
        error.code === "ENOTFOUND") &&
      reconnectAttempts < MAX_RECONNECT_ATTEMPTS
    ) {
      reconnectAttempts++;
      logger.info(`Retrying database connection (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);

      await new Promise((resolve) => setTimeout(resolve, RECONNECT_DELAY));
      return initDatabase(); // Retry
    }

    logger.error(
      "Database connection is required. Application cannot start.",
    );
    throw error; // Fail fast - don't start the server without DB
  }
};

/**
 * Handle database reconnection
 */
const handleDatabaseReconnection = async () => {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    logger.error("Max reconnection attempts reached. Restart required.");
    return;
  }

  reconnectAttempts++;
  logger.info(`Attempting database reconnection (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);

  try {
    // Close existing connections
    if (prisma) {
      await prisma.$disconnect().catch(() => {});
      prisma = null;
    }
    if (pool) {
      await pool.end().catch(() => {});
      pool = null;
    }

    // Wait before retrying
    await new Promise((resolve) => setTimeout(resolve, RECONNECT_DELAY));

    // Reinitialize
    await initDatabase();
    logger.info("Database reconnected successfully");
  } catch (error) {
    logger.error("Database reconnection failed", {
      error: error.message,
      attempt: reconnectAttempts,
    });

    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      // Retry again
      setTimeout(() => handleDatabaseReconnection(), RECONNECT_DELAY);
    }
  }
};

/**
 * Get Prisma Client instance
 */
export const getPrisma = () => {
  if (!prisma) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return prisma;
};

/**
 * Check database connection health
 */
export const checkDatabaseHealth = async () => {
  try {
    if (!prisma) {
      return { healthy: false, error: "Database not initialized" };
    }

    // Simple query to check connection
    await prisma.$queryRaw`SELECT 1`;
    return { healthy: true };
  } catch (error) {
    logger.error("Database health check failed", { error: error.message });
    return { healthy: false, error: error.message };
  }
};

/**
 * Close database connections gracefully
 */
export const closeDatabase = async () => {
  try {
    if (prisma) {
      await prisma.$disconnect();
      prisma = null;
    }
    if (pool) {
      await pool.end();
      pool = null;
    }
    logger.info("Database connections closed");
  } catch (error) {
    logger.error("Error closing database connections", {
      error: error.message,
    });
    throw error;
  }
};

// Export default prisma instance for convenience
export default prisma;
