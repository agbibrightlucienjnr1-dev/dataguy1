import {
  getAllUsers,
  getAllOrders,
  getPlatformStatistics,
  getAllWalletBalances,
  getUserDetails,
  updateBundleStatus,
  getFailedOrders,
} from "../services/adminService.js";
import { initiateHubnetOrder } from "../services/orderService.js";
import { checkBalance } from "../services/hubnetService.js";
import {
  getDatabaseSize,
  runFullCleanup,
  optimizeDatabase,
} from "../services/cleanupService.js";
import { getMemoryUsage, checkMemoryUsage } from "../utils/memoryMonitor.js";
import { asyncHandler, AppError } from "../middlewares/errorHandler.js";
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
 * Cached for 2 minutes (statistics change frequently)
 */
export const getStatistics = asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Generate cache key based on date filters
    const cacheKey = `admin:stats:${startDate || "all"}:${endDate || "all"}`;
    const cache = (await import("../utils/cache.js")).default;
    const cached = cache.get(cacheKey);

    if (cached) {
      res.setHeader("X-Cache", "HIT");
      return res.status(200).json(cached);
    }

    const result = await getPlatformStatistics({
      startDate,
      endDate,
    });

    const response = {
      success: true,
      data: result,
    };

    // Cache for 2 minutes
    cache.set(cacheKey, response, 2 * 60 * 1000);
    res.setHeader("X-Cache", "MISS");

    res.status(200).json(response);
  } catch (error) {
    logger.error("Error fetching statistics", error);
    throw error;
  }
});

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

/**
 * Fulfill order - manually trigger Hubnet data delivery
 * POST /api/admin/orders/:orderId/fulfill
 */
export const fulfillOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  logger.info("Admin triggering order fulfillment", { orderId });

  const result = await initiateHubnetOrder(orderId);

  res.status(200).json({
    success: true,
    message: "Order fulfillment initiated successfully",
    order: result,
  });
});

/**
 * Get Hubnet wallet balance
 * GET /api/admin/hubnet-balance
 */
export const getHubnetBalance = asyncHandler(async (req, res) => {
  try {
    const balanceData = await checkBalance();

    res.status(200).json({
      success: true,
      balance: balanceData.balance,
      currency: balanceData.currency || "GHS",
    });
  } catch (error) {
    logger.error("Error fetching Hubnet balance", error);
    throw error;
  }
});

/**
 * Get total wallet balance for all agents and sub-agents
 * GET /api/admin/total-wallet-balance
 */
export const getTotalWalletBalance = asyncHandler(async (req, res) => {
  const prisma = (await import("../config/database.js")).getPrisma();

  try {
    // Sum all wallet balances for agents and sub-agents
    const result = await prisma.wallet.aggregate({
      _sum: {
        balance: true,
      },
      where: {
        user: {
          role: {
            in: ["agent", "sub_agent"],
          },
        },
      },
    });

    const totalBalance = result._sum.balance || 0;

    res.status(200).json({
      success: true,
      totalBalance: totalBalance.toString(),
      currency: "GHS",
    });
  } catch (error) {
    logger.error("Error fetching total wallet balance", error);
    throw error;
  }
});

/**
 * Mark order as completed - manually confirm delivery
 * Used when webhook doesn't work (e.g., local development) or for manual verification
 * POST /api/admin/orders/:orderId/complete
 */
export const markOrderCompleted = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const prisma = (await import("../config/database.js")).getPrisma();

  logger.info("Admin manually marking order as completed", { orderId });

  // Get the order first
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  // Only allow completing orders that are in "processing" status
  if (order.status !== "processing") {
    throw new AppError(
      `Cannot mark order as completed. Current status: ${order.status}. Only 'processing' orders can be marked as completed.`,
      400,
    );
  }

  // Update order to completed
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "completed",
      completedAt: new Date(),
      hubnetResponse: JSON.stringify({
        ...JSON.parse(order.hubnetResponse || "{}"),
        manuallyCompleted: true,
        completedBy: "admin",
        completedAt: new Date().toISOString(),
      }),
    },
    include: {
      bundle: true,
      seller: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  });

  logger.success("Order manually marked as completed", { orderId });

  res.status(200).json({
    success: true,
    message: "Order marked as completed successfully",
    order: updatedOrder,
  });
});

/**
 * Get database size and statistics
 * GET /api/admin/database/stats
 * Cached for 2 minutes to reduce database load
 */
export const getDatabaseStats = asyncHandler(async (req, res) => {
  try {
    // Check cache first (2 minute TTL for database stats)
    const cache = (await import("../utils/cache.js")).default;
    const cacheKey = `db:stats:${req.user?.id || "anonymous"}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      res.setHeader("X-Cache", "HIT");
      return res.status(200).json(cached);
    }

    const stats = await getDatabaseSize();
    const response = {
      success: true,
      ...stats,
    };

    // Cache for 2 minutes
    cache.set(cacheKey, response, 2 * 60 * 1000);
    res.setHeader("X-Cache", "MISS");

    res.status(200).json(response);
  } catch (error) {
    logger.error("Error fetching database stats", error);
    throw error;
  }
});

/**
 * Get memory usage statistics
 * GET /api/admin/memory/stats
 * Cached for 30 seconds (memory changes frequently)
 */
export const getMemoryStats = asyncHandler(async (req, res) => {
  try {
    // Check cache first (30 second TTL for memory stats)
    const cache = (await import("../utils/cache.js")).default;
    const cacheKey = "memory:stats";
    const cached = cache.get(cacheKey);

    if (cached) {
      res.setHeader("X-Cache", "HIT");
      return res.status(200).json(cached);
    }

    const memory = getMemoryUsage();
    const status = checkMemoryUsage(80); // 80% threshold

    const response = {
      success: true,
      ...memory,
      status,
    };

    // Cache for 30 seconds
    cache.set(cacheKey, response, 30 * 1000);
    res.setHeader("X-Cache", "MISS");

    res.status(200).json(response);
  } catch (error) {
    logger.error("Error fetching memory stats", error);
    throw error;
  }
});

/**
 * Run database cleanup
 * POST /api/admin/database/cleanup
 */
export const runDatabaseCleanup = asyncHandler(async (req, res) => {
  try {
    const {
      archiveOrdersDays = 90,
      cleanupTransactionsDays = 180,
      hardDeleteOrders = false,
      optimize = true,
    } = req.body;

    const result = await runFullCleanup({
      archiveOrdersDays,
      cleanupTransactionsDays,
      hardDeleteOrders,
      optimize,
    });

    // Invalidate database stats cache after cleanup
    const cache = (await import("../utils/cache.js")).default;
    const cacheStore = cache.store;
    cacheStore.forEach((_, key) => {
      if (key.startsWith("db:stats:")) {
        cache.delete(key);
      }
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error("Error running database cleanup", error);
    throw error;
  }
});

/**
 * Optimize database
 * POST /api/admin/database/optimize
 */
export const optimizeDatabaseEndpoint = asyncHandler(async (req, res) => {
  try {
    const result = await optimizeDatabase();

    // Invalidate database stats cache after optimization
    const cache = (await import("../utils/cache.js")).default;
    const cacheStore = cache.store;
    cacheStore.forEach((_, key) => {
      if (key.startsWith("db:stats:")) {
        cache.delete(key);
      }
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error("Error optimizing database", error);
    throw error;
  }
});
