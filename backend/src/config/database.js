import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

let prisma = null;

/**
 * Initialize Prisma Client with error handling
 * Fails fast if database connection is unavailable
 */
export const initDatabase = async () => {
  if (prisma) {
    return prisma;
  }

  try {
    // Create PostgreSQL connection pool with limits to prevent exhaustion
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      max: parseInt(process.env.DB_POOL_MAX || "20", 10), // Maximum pool size
      idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || "30000", 10), // 30 seconds
      connectionTimeoutMillis: parseInt(
        process.env.DB_POOL_CONNECTION_TIMEOUT || "2000",
        10,
      ), // 2 seconds
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
    console.log("✅ Database connected successfully");

    return prisma;
  } catch (error) {
    console.error("❌ Failed to connect to database:", error.message);
    console.error(
      "⚠️ Database connection is required. Application cannot start.",
    );
    throw error; // Fail fast - don't start the server without DB
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
 * Close database connections gracefully
 */
export const closeDatabase = async () => {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
    console.log("✅ Database connections closed");
  }
};

// Export default prisma instance for convenience
export default prisma;
