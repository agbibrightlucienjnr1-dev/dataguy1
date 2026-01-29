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
} from "../controllers/adminController.js";
import { authenticate } from "../middlewares/auth.js";
import { requireAdmin } from "../utils/authorization.js";

const router = express.Router();

// All admin routes require authentication and admin role
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

/**
 * Orders Management
 */
router.get("/orders", getOrders); // List all orders with filters
router.get("/orders/failed", getFailedOrdersList); // Get failed orders

/**
 * Statistics
 */
router.get("/statistics", getStatistics); // Platform statistics

/**
 * Wallets
 */
router.get("/wallets", getWallets); // View all wallet balances

/**
 * Bundles Management
 */
router.patch("/bundles/:bundleId/status", toggleBundleStatus); // Activate/deactivate bundle

export default router;
