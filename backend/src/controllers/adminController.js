import {
  getAllUsers,
  getAllOrders,
  getPlatformStatistics,
  getAllWalletBalances,
  getUserDetails,
  updateBundleStatus,
  getFailedOrders,
  generateReportData,
} from "../services/adminService.js";
import { initiateHubnetOrder } from "../services/orderService.js";
import { addCustomersManually } from "../services/customerService.js";
import { getAnalyticsStats, getAnalyticsChartData } from "../services/analyticsService.js";
import { checkBalance } from "../services/hubnetService.js";
import {
  getDatabaseSize,
  runFullCleanup,
  optimizeDatabase,
} from "../services/cleanupService.js";
import { getMemoryUsage, checkMemoryUsage } from "../utils/memoryMonitor.js";
import { asyncHandler, AppError } from "../middlewares/errorHandler.js";
import { logger } from "../utils/logger.js";
import { getPrisma } from "../config/database.js";
import { sendSMS } from "../services/smsService.js";

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
 * Get Bossu Data Hub wallet balance
 * GET /api/admin/bossu-balance
 */
export const getBossuBalance = asyncHandler(async (req, res) => {
  try {
    const { checkBalance: bossuCheckBalance } = await import("../services/bossuService.js");
    const balanceData = await bossuCheckBalance();

    res.status(200).json({
      success: true,
      balance: balanceData.balance,
      currency: balanceData.currency || "GHS",
    });
  } catch (error) {
    logger.error("Error fetching Bossu balance", error);
    // Don't throw — return 0 balance so UI doesn't break when Bossu key is missing
    res.status(200).json({
      success: true,
      balance: 0,
      currency: "GHS",
      error: "Failed to fetch Bossu balance",
    });
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

  // Do not allow completing orders that are already completed or still pending payment
  if (order.status === "completed" || order.status === "pending") {
    throw new AppError(
      `Cannot mark order as completed. Current status: ${order.status}.`,
      400,
    );
  }

  // Update order to completed
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "completed",
      completedAt: new Date(),
      providerResponse: JSON.stringify({
        ...JSON.parse(order.providerResponse || "{}"),
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
      statusesToCleanup = ["failed", "cancelled"],
    } = req.body;

    const result = await runFullCleanup({
      archiveOrdersDays,
      cleanupTransactionsDays,
      hardDeleteOrders,
      optimize,
      statusesToCleanup,
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

/**
 * Get Reports Data
 * GET /api/admin/reports
 */
export const getReportsData = asyncHandler(async (req, res) => {
  const reportsData = await generateReportData();

  res.status(200).json({
    success: true,
    data: reportsData,
  });
});

/**
 * Send SMS to specific targets (Admin feature)
 * POST /api/admin/sms/send
 */
export const sendAdminSMS = asyncHandler(async (req, res) => {
  const { target, customNumber, message, orderStatus, startDate, endDate } = req.body;

  if (!message || message.trim() === "") {
    throw new AppError("Message cannot be empty", 400);
  }

  const prisma = getPrisma();
  let recipients = [];

  try {
    if (target === "specific") {
      if (!customNumber) {
        throw new AppError("Specific number is required", 400);
      }
      recipients.push(customNumber);
    } else if (target === "all_customers") {
      const customers = await prisma.customer.findMany({ select: { phone: true } });
      recipients = customers.map(c => c.phone).filter(Boolean);
    } else if (target === "all_agents") {
      const agents = await prisma.user.findMany({ 
        where: { role: { in: ["agent", "sub_agent"] } },
        select: { phone: true } 
      });
      recipients = agents.map(a => a.phone).filter(Boolean);
    } else if (target === "both") {
      const [customers, agents] = await Promise.all([
        prisma.customer.findMany({ select: { phone: true } }),
        prisma.user.findMany({ 
          where: { role: { in: ["agent", "sub_agent"] } },
          select: { phone: true } 
        })
      ]);
      recipients = [
        ...customers.map(c => c.phone),
        ...agents.map(a => a.phone)
      ].filter(Boolean);
    } else if (target === "order_status") {
      if (!orderStatus || !["processing", "pending", "completed", "failed", "cancelled"].includes(orderStatus)) {
        throw new AppError("Valid order status is required", 400);
      }
      
      const whereClause = { status: orderStatus };
      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          whereClause.createdAt.gte = start;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          whereClause.createdAt.lte = end;
        }
      }

      const orders = await prisma.order.findMany({
        where: whereClause,
        select: { customerPhone: true }
      });
      recipients = orders.map(o => o.customerPhone).filter(Boolean);
    } else {
      throw new AppError("Invalid target specified", 400);
    }

    // Deduplicate recipients
    recipients = [...new Set(recipients)];

    if (recipients.length === 0) {
      throw new AppError("No valid recipients found for this target", 400);
    }

    const result = await sendSMS(recipients, message);

    if (!result.success) {
      throw new AppError(result.message || "Failed to send SMS via the provider", 500);
    }

    res.status(200).json({
      success: true,
      message: `SMS queued to send to ${recipients.length} recipient${recipients.length !== 1 ? 's' : ''}.`,
    });

  } catch (error) {
    logger.error("Error in sendAdminSMS", error);
    throw error;
  }
});

/**
 * Manually insert or update customers allowing them to bypass web-order USSD limits
 * POST /api/admin/customers
 */
export const addCustomers = asyncHandler(async (req, res) => {
  const { phones } = req.body;

  if (!Array.isArray(phones)) {
    throw new AppError("Phones must be provided as an array of strings", 400);
  }

  try {
    const count = await addCustomersManually(phones);
    
    res.status(200).json({
      success: true,
      message: `Successfully added ${count} new eligible customer(s).`,
      count,
    });
  } catch (error) {
    logger.error("Error adding customers manually", error);
    throw new AppError("Failed to add customers manually", 500);
  }
});

/**
 * Get internal analytics tracking data
 * GET /api/admin/analytics
 */
export const getAnalyticsDashboard = asyncHandler(async (req, res) => {
  const [stats, chartData] = await Promise.all([
    getAnalyticsStats(30),
    getAnalyticsChartData(7)
  ]);

  res.status(200).json({
    success: true,
    data: {
      stats,
      chartData
    }
  });
});
