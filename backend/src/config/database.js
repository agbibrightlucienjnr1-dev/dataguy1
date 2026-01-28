import pg from "pg";
const { Pool } = pg;

let pool = null;

/**
 * Initialize PostgreSQL connection pool
 */
export const initDatabase = () => {
  if (pool) {
    return pool;
  }

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on("connect", () => {
    console.log("✅ Database connected");
  });

  pool.on("error", (err) => {
    console.error("❌ Unexpected database error:", err);
  });

  return pool;
};

/**
 * Get database pool instance
 */
export const getPool = () => {
  if (!pool) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return pool;
};

/**
 * Execute a query with error handling
 */
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await getPool().query(text, params);
    const duration = Date.now() - start;

    if (process.env.NODE_ENV === "development") {
      console.log("📊 Query executed:", {
        text,
        duration,
        rows: result.rowCount,
      });
    }

    return result;
  } catch (error) {
    console.error("❌ Database query error:", error);
    throw error;
  }
};

/**
 * Close database connections
 */
export const closeDatabase = async () => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log("✅ Database connections closed");
  }
};
