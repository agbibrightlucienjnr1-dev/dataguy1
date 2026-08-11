import express from "express";
import {
  getUsers,
  getUserById,
  getOrders,
  getStatistics,
  getWallets,
  toggleBundleStatus,
  getFailedOrdersList,
  getDashboardSummary,
  fulfillOrder,
  markOrderCompleted,
  updateOrderStatusAdmin,
  checkDeliveryStatus,
  getHubnetBalance,
  getBossuBalance,
  getTotalWalletBalance,
  getDatabaseStats,
  getMemoryStats,
  runDatabaseCleanup,
  optimizeDatabaseEndpoint,
  getReportsData,
  sendAdminSMS,
  addCustomers,
  getAnalyticsDashboard,
  adjustWalletBalance,
  getProfitAnalysis,
  createExpense,
  deleteExpense,
} from "../controllers/adminController.js";
import { authenticate } from "../middlewares/auth.js";
import { requireAdmin } from "../utils/authorization.js";
import { adminRateLimiter } from "../middlewares/rateLimiter.js";
import {
  getCacheStatsMiddleware,
  clearCacheMiddleware,
} from "../middlewares/cacheMiddleware.js";

const router = express.Router();

// All admin routes require authentication and admin role
// Apply rate limiting to all admin routes
router.use(adminRateLimiter);
router.use(authenticate);
router.use(requireAdmin);

/**
 * Dashboard
 */
router.get("/dashboard", getDashboardSummary);

/**
 * Users Management
 */
router.get("/users", getUsers); // List all users with filters
router.get("/users/:userId", getUserById); // Get user details
router.post("/users/:userId/wallet/adjust", adjustWalletBalance); // Adjust wallet balance

/**
 * Orders Management
 */
router.get("/orders", getOrders); // List all orders with filters
router.get("/orders/failed", getFailedOrdersList); // Get failed orders
router.post("/orders/:orderId/fulfill", fulfillOrder); // Manually fulfill order via Hubnet
router.post("/orders/:orderId/complete", markOrderCompleted); // Manually mark order as completed
router.post("/orders/:orderId/check-delivery-status", checkDeliveryStatus); // Manually check order delivery status with provider
router.put("/orders/:orderId/status", updateOrderStatusAdmin); // Manually override order status to any status

/**
 * Statistics & Profit Analysis
 */
router.get("/statistics", getStatistics); // Platform statistics
router.get("/profit-analysis", getProfitAnalysis);

/**
 * Expenses Management
 */
router.post("/expenses", createExpense);
router.delete("/expenses/:id", deleteExpense);

/**
 * Wallets
 */
router.get("/wallets", getWallets); // View all wallet balances

/**
 * Provider Balances
 */
router.get("/hubnet-balance", getHubnetBalance);
router.get("/bossu-balance", getBossuBalance);
router.get("/total-wallet-balance", getTotalWalletBalance);

/**
 * Database Management
 */
router.get("/database/stats", getDatabaseStats); // Get database size statistics (cached 2 min)
router.get("/memory/stats", getMemoryStats); // Get memory usage statistics (cached 30 sec)
router.post("/database/cleanup", runDatabaseCleanup); // Run database cleanup
router.post("/database/optimize", optimizeDatabaseEndpoint); // Optimize database

/**
 * Cache Management
 */
router.get("/cache/stats", getCacheStatsMiddleware); // Get cache statistics
router.post("/cache/clear", clearCacheMiddleware); // Clear all cache

/**
 * Bundles Management
 */
router.patch("/bundles/:bundleId/status", toggleBundleStatus); // Activate/deactivate bundle

/**
 * Analytics Reports
 */
router.get("/reports", getReportsData);
router.get("/analytics", getAnalyticsDashboard);

/**
 * SMS/Notifications Management
 */
router.post("/sms/send", sendAdminSMS);

/**
 * Customers Management
 */
router.post("/customers", addCustomers);

export default router;
