import {
  getAllUsers,
  getAllOrders,
  getPlatformStatistics,
  getAllWalletBalances,
  getUserDetails,
  updateBundleStatus,
  getFailedOrders,
} from "../services/adminService.js";
import { logger } from "../utils/logger.js";

/**
 * Get all users (agents and sub-agents)
 * GET /api/admin/users
 */
export const getUsers = async (req, res) => {
  try {
    const { role, search, page, limit } = req.query;

    const result = await getAllUsers({
      role,
      search,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error("Error fetching users", error);
    throw error;
  }
};

/**
 * Get user details by ID
 * GET /api/admin/users/:userId
 */
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await getUserDetails(userId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error("Error fetching user details", error);
    throw error;
  }
};

/**
 * Get all orders with filters
 * GET /api/admin/orders
 */
export const getOrders = async (req, res) => {
  try {
    const { status, sellerId, network, startDate, endDate, page, limit } =
      req.query;

    const result = await getAllOrders({
      status,
      sellerId,
      network,
      startDate,
      endDate,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error("Error fetching orders", error);
    throw error;
  }
};

/**
 * Get platform statistics
 * GET /api/admin/statistics
 */
export const getStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const result = await getPlatformStatistics({
      startDate,
      endDate,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Error fetching statistics", error);
    throw error;
  }
};

/**
 * Get all wallet balances
 * GET /api/admin/wallets
 */
export const getWallets = async (req, res) => {
  try {
    const { role, minBalance, page, limit } = req.query;

    const result = await getAllWalletBalances({
      role,
      minBalance,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error("Error fetching wallets", error);
    throw error;
  }
};

/**
 * Update bundle status (activate/deactivate)
 * PATCH /api/admin/bundles/:bundleId/status
 */
export const toggleBundleStatus = async (req, res) => {
  try {
    const { bundleId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean value",
      });
    }

    const bundle = await updateBundleStatus(bundleId, isActive);

    res.status(200).json({
      success: true,
      message: `Bundle ${isActive ? "activated" : "deactivated"} successfully`,
      bundle,
    });
  } catch (error) {
    logger.error("Error updating bundle status", error);
    throw error;
  }
};

/**
 * Get failed orders
 * GET /api/admin/orders/failed
 */
export const getFailedOrdersList = async (req, res) => {
  try {
    const { page, limit } = req.query;

    const result = await getFailedOrders(
      parseInt(page) || 1,
      parseInt(limit) || 50,
    );

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error("Error fetching failed orders", error);
    throw error;
  }
};

/**
 * Get dashboard summary
 * GET /api/admin/dashboard
 */
export const getDashboardSummary = async (req, res) => {
  try {
    // Get statistics for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [overallStats, last30DaysStats] = await Promise.all([
      getPlatformStatistics({}),
      getPlatformStatistics({
        startDate: thirtyDaysAgo.toISOString(),
      }),
    ]);

    res.status(200).json({
      success: true,
      overall: overallStats.overview,
      last30Days: last30DaysStats.overview,
      revenueByNetwork: overallStats.revenueByNetwork,
      topSellers: overallStats.topSellers.slice(0, 5),
    });
  } catch (error) {
    logger.error("Error fetching dashboard summary", error);
    throw error;
  }
};
