/**
 * Database Cleanup Cron Job
 * 
 * Run this script periodically (e.g., daily via cron) to clean up old data
 * 
 * Usage:
 *   node src/scripts/cleanupCron.js
 * 
 * Or add to crontab:
 *   0 2 * * * cd /path/to/backend && node src/scripts/cleanupCron.js >> logs/cleanup.log 2>&1
 *   (Runs daily at 2 AM)
 */

import dotenv from "dotenv";
dotenv.config();

import { initDatabase, closeDatabase } from "../config/database.js";
import { runFullCleanup, getDatabaseSize } from "../services/cleanupService.js";
import { getMemoryUsage } from "../utils/memoryMonitor.js";
import { logger } from "../utils/logger.js";

const CLEANUP_CONFIG = {
  // Archive orders older than 90 days
  archiveOrdersDays: parseInt(process.env.CLEANUP_ORDERS_DAYS || "90", 10),
  
  // Clean up transactions older than 180 days
  cleanupTransactionsDays: parseInt(process.env.CLEANUP_TRANSACTIONS_DAYS || "180", 10),
  
  // Hard delete orders (permanently delete instead of soft delete)
  hardDeleteOrders: process.env.CLEANUP_HARD_DELETE === "true",
  
  // Run database optimization (VACUUM)
  optimize: process.env.CLEANUP_OPTIMIZE !== "false",
};

async function runCleanup() {
  try {
    logger.info("Starting scheduled database cleanup", CLEANUP_CONFIG);

    // Initialize database
    await initDatabase();

    // Get initial database size
    const initialSize = await getDatabaseSize();
    logger.info("Initial database size", {
      databaseSize: initialSize.database.database_size,
      rowCounts: initialSize.rowCounts,
    });

    // Get initial memory usage
    const initialMemory = getMemoryUsage();
    logger.info("Initial memory usage", {
      rss: initialMemory.formatted.rss,
      heapUsed: initialMemory.formatted.heapUsed,
    });

    // Run cleanup
    const result = await runFullCleanup(CLEANUP_CONFIG);
    logger.success("Cleanup completed", result);

    // Get final database size
    const finalSize = await getDatabaseSize();
    logger.info("Final database size", {
      databaseSize: finalSize.database.database_size,
      rowCounts: finalSize.rowCounts,
    });

    // Get final memory usage
    const finalMemory = getMemoryUsage();
    logger.info("Final memory usage", {
      rss: finalMemory.formatted.rss,
      heapUsed: finalMemory.formatted.heapUsed,
    });

    // Calculate space saved
    const spaceSaved = {
      orders: initialSize.rowCounts.orders - finalSize.rowCounts.orders,
      transactions:
        initialSize.rowCounts.walletTransactions -
        finalSize.rowCounts.walletTransactions,
    };

    logger.success("Cleanup summary", {
      ordersArchived: result.results.orders?.archived || 0,
      ordersDeleted: result.results.orders?.deleted || 0,
      transactionsDeleted: result.results.transactions?.deleted || 0,
      spaceSaved,
    });

    // Close database connection
    await closeDatabase();

    process.exit(0);
  } catch (error) {
    logger.error("Cleanup job failed", error);
    process.exit(1);
  }
}

// Run cleanup
runCleanup();
