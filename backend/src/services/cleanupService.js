import { getPrisma } from "../config/database.js";
import { logger } from "../utils/logger.js";

/**
 * Database cleanup and archiving service
 * Helps manage database space by archiving old data
 */

/**
 * Archive old completed orders (older than specified days)
 * Moves them to an archived state or deletes them
 * @param {number} daysOld - Archive orders older than this many days (default: 90)
 * @param {boolean} hardDelete - If true, permanently delete instead of soft delete
 * @param {Array<string>} statuses - The exact statuses of orders to delete
 * @returns {Promise<Object>} Cleanup statistics
 */
export const archiveOldOrders = async (daysOld = 90, hardDelete = false, statuses = ["failed", "cancelled"]) => {
  const prisma = getPrisma();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  try {
    logger.info("Starting order archiving", {
      daysOld,
      cutoffDate: cutoffDate.toISOString(),
      hardDelete,
    });

    // Fail-safe to avoid accidentally wiping everything if empty array passes
    if (!statuses || statuses.length === 0) {
      return {
        success: false,
        archived: 0,
        deleted: 0,
        message: "No statuses selected for order cleanup",
      };
    }

    const where = {
      status: {
        in: statuses,
      },
      createdAt: {
        lt: cutoffDate,
      },
    };

    // Count orders to be archived
    const count = await prisma.order.count({ where });

    if (count === 0) {
      logger.info("No orders to archive");
      return {
        success: true,
        archived: 0,
        deleted: 0,
        message: "No orders found to archive",
      };
    }

    if (hardDelete) {
      // Permanently delete old orders
      const result = await prisma.order.deleteMany({ where });
      logger.success("Old orders deleted", {
        count: result.count,
        daysOld,
      });

      return {
        success: true,
        archived: 0,
        deleted: result.count,
        message: `Deleted ${result.count} old orders`,
      };
    } else {
      // Soft delete: Mark as archived (if you add an archived field)
      // For now, we'll just log and return count
      // You can add an 'archived' boolean field to the Order model later
      logger.info("Orders to archive (soft delete not implemented)", {
        count,
        daysOld,
      });

      return {
        success: true,
        archived: count,
        deleted: 0,
        message: `${count} orders would be archived (soft delete not implemented)`,
      };
    }
  } catch (error) {
    logger.error("Error archiving old orders", error);
    throw error;
  }
};

/**
 * Clean up old wallet transactions (older than specified days)
 * Keeps only essential transaction records
 * @param {number} daysOld - Clean up transactions older than this many days (default: 180)
 * @returns {Promise<Object>} Cleanup statistics
 */
export const cleanupOldWalletTransactions = async (daysOld = 180) => {
  const prisma = getPrisma();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  try {
    logger.info("Starting wallet transaction cleanup", {
      daysOld,
      cutoffDate: cutoffDate.toISOString(),
    });

    // Keep transactions that are:
    // 1. Recent (within cutoff)
    // 2. Or have an associated order (important for audit)
    // 3. Or are withdrawals (important for financial records)
    const where = {
      createdAt: {
        lt: cutoffDate,
      },
      orderId: null, // No associated order
      type: {
        not: "withdrawal", // Keep all withdrawals
      },
    };

    const count = await prisma.walletTransaction.count({ where });

    if (count === 0) {
      logger.info("No wallet transactions to clean up");
      return {
        success: true,
        deleted: 0,
        message: "No wallet transactions found to clean up",
      };
    }

    // Delete old non-essential transactions
    const result = await prisma.walletTransaction.deleteMany({ where });

    logger.success("Old wallet transactions cleaned up", {
      count: result.count,
      daysOld,
    });

    return {
      success: true,
      deleted: result.count,
      message: `Deleted ${result.count} old wallet transactions`,
    };
  } catch (error) {
    logger.error("Error cleaning up wallet transactions", error);
    throw error;
  }
};

/**
 * Vacuum and optimize database
 * Runs PostgreSQL VACUUM to reclaim space
 * @returns {Promise<Object>} Optimization results
 */
export const optimizeDatabase = async () => {
  const prisma = getPrisma();

  try {
    logger.info("Starting database optimization (VACUUM)");

    // Run VACUUM ANALYZE to reclaim space and update statistics
    await prisma.$executeRawUnsafe("VACUUM ANALYZE;");

    logger.success("Database optimization completed");

    return {
      success: true,
      message: "Database optimized successfully",
    };
  } catch (error) {
    logger.error("Error optimizing database", error);
    throw error;
  }
};

/**
 * Get database size statistics
 * @returns {Promise<Object>} Database size information
 */
export const getDatabaseSize = async () => {
  const prisma = getPrisma();

  try {
    // Get row counts for main tables (always available)
    const rowCounts = await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.walletTransaction.count(),
      prisma.withdrawal.count(),
      prisma.dataBundle.count(),
    ]);

    let dbSize = { database_size: "N/A", database_size_bytes: 0 };
    let tables = [];

    // Try to get database size (may fail due to permissions)
    try {
      const dbSizeResult = await prisma.$queryRaw`
        SELECT 
          pg_size_pretty(pg_database_size(current_database())) as database_size,
          pg_database_size(current_database()) as database_size_bytes
      `;

      if (Array.isArray(dbSizeResult) && dbSizeResult.length > 0) {
        const result = dbSizeResult[0];
        dbSize = {
          database_size: result.database_size || "N/A",
          database_size_bytes:
            typeof result.database_size_bytes === "bigint"
              ? result.database_size_bytes.toString()
              : result.database_size_bytes || 0,
        };
      }
    } catch (sizeError) {
      logger.warn("Could not get database size (permissions may be insufficient)", {
        error: sizeError.message,
      });
      // Continue without database size
    }

    // Try to get table sizes (may fail due to permissions)
    try {
      const tableSizesResult = await prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
          pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `;

      if (Array.isArray(tableSizesResult)) {
        // Convert BigInt values to strings for JSON serialization
        tables = tableSizesResult.map((table) => ({
          schemaname: table.schemaname,
          tablename: table.tablename,
          size: table.size || "N/A",
          size_bytes:
            typeof table.size_bytes === "bigint"
              ? table.size_bytes.toString()
              : table.size_bytes || 0,
        }));
      }
    } catch (tableError) {
      logger.warn("Could not get table sizes (permissions may be insufficient)", {
        error: tableError.message,
      });
      // Continue without table sizes
    }

    return {
      success: true,
      database: dbSize,
      tables: tables,
      rowCounts: {
        users: rowCounts[0] || 0,
        orders: rowCounts[1] || 0,
        walletTransactions: rowCounts[2] || 0,
        withdrawals: rowCounts[3] || 0,
        dataBundles: rowCounts[4] || 0,
      },
    };
  } catch (error) {
    logger.error("Error getting database size", {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

/**
 * Run all cleanup tasks
 * @param {Object} options - Cleanup options
 * @returns {Promise<Object>} Cleanup results
 */
export const runFullCleanup = async (options = {}) => {
  const {
    archiveOrdersDays = 90,
    cleanupTransactionsDays = 180,
    hardDeleteOrders = false,
    optimize = true,
    statusesToCleanup = ["failed", "cancelled"],
  } = options;

  try {
    logger.info("Starting full database cleanup", options);

    const results = {
      orders: null,
      transactions: null,
      optimization: null,
    };

    // Archive old orders
    results.orders = await archiveOldOrders(archiveOrdersDays, hardDeleteOrders, statusesToCleanup);

    // Clean up old transactions
    results.transactions = await cleanupOldWalletTransactions(
      cleanupTransactionsDays,
    );

    // Optimize database
    if (optimize) {
      results.optimization = await optimizeDatabase();
    }

    logger.success("Full database cleanup completed", results);

    return {
      success: true,
      results,
      message: "Database cleanup completed successfully",
    };
  } catch (error) {
    logger.error("Error running full cleanup", error);
    throw error;
  }
};
