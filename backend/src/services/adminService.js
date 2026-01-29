import { getPrisma } from "../config/database.js";
import { AppError } from "../middlewares/errorHandler.js";
import { logger } from "../utils/logger.js";

/**
 * Get all users (agents and sub-agents)
 */
export const getAllUsers = async (filters = {}) => {
  const prisma = getPrisma();
  const { role, search, page = 1, limit = 50 } = filters;

  const skip = (page - 1) * limit;

  // Build where clause
  const where = {
    role: { not: "admin" }, // Don't include admins
  };

  if (role && (role === "agent" || role === "sub_agent")) {
    where.role = role;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        paymentLinkCode: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  // Get wallet balances for each user
  const usersWithWallets = await Promise.all(
    users.map(async (user) => {
      const wallet = await prisma.wallet.findUnique({
        where: { userId: user.id },
        select: { balance: true },
      });

      return {
        ...user,
        walletBalance: wallet?.balance || "0.00",
        totalOrders: user._count.orders,
      };
    }),
  );

  return {
    users: usersWithWallets,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get all orders with filters
 */
export const getAllOrders = async (filters = {}) => {
  const prisma = getPrisma();
  const {
    status,
    sellerId,
    network,
    startDate,
    endDate,
    page = 1,
    limit = 50,
  } = filters;

  const skip = (page - 1) * limit;

  // Build where clause
  const where = {};

  if (status) {
    where.status = status;
  }

  if (sellerId) {
    where.sellerId = sellerId;
  }

  if (network) {
    where.bundle = { network };
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.createdAt.lte = new Date(endDate);
    }
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        bundle: {
          select: {
            network: true,
            volume: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            phone: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get platform statistics
 */
export const getPlatformStatistics = async (filters = {}) => {
  const prisma = getPrisma();
  const { startDate, endDate } = filters;

  // Build date filter
  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) {
      dateFilter.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.createdAt.lte = new Date(endDate);
    }
  }

  // Get order statistics
  const [
    totalOrders,
    completedOrders,
    pendingOrders,
    processingOrders,
    failedOrders,
    totalRevenue,
    totalCommissionsPaid,
    agentCount,
    subAgentCount,
    totalWalletBalance,
  ] = await Promise.all([
    prisma.order.count({ where: dateFilter }),
    prisma.order.count({ where: { ...dateFilter, status: "completed" } }),
    prisma.order.count({ where: { ...dateFilter, status: "pending" } }),
    prisma.order.count({ where: { ...dateFilter, status: "processing" } }),
    prisma.order.count({ where: { ...dateFilter, status: "failed" } }),
    prisma.order.aggregate({
      where: { ...dateFilter, status: { in: ["completed", "processing"] } },
      _sum: { pricePaid: true },
    }),
    prisma.order.aggregate({
      where: {
        ...dateFilter,
        status: { in: ["completed", "processing"] },
        commissionPaid: true,
      },
      _sum: { commissionAmount: true },
    }),
    prisma.user.count({ where: { role: "agent" } }),
    prisma.user.count({ where: { role: "sub_agent" } }),
    prisma.wallet.aggregate({
      _sum: { balance: true },
    }),
  ]);

  // Get revenue breakdown by network
  const revenueByNetwork = await prisma.order.groupBy({
    by: ["bundleId"],
    where: { ...dateFilter, status: { in: ["completed", "processing"] } },
    _sum: {
      pricePaid: true,
    },
    _count: true,
  });

  // Get bundle info for revenue breakdown
  const bundleIds = revenueByNetwork.map((r) => r.bundleId);
  const bundles = await prisma.dataBundle.findMany({
    where: { id: { in: bundleIds } },
    select: { id: true, network: true, volume: true },
  });

  const networkRevenue = {};
  revenueByNetwork.forEach((rev) => {
    const bundle = bundles.find((b) => b.id === rev.bundleId);
    if (bundle) {
      const network = bundle.network;
      if (!networkRevenue[network]) {
        networkRevenue[network] = {
          revenue: 0,
          orders: 0,
        };
      }
      networkRevenue[network].revenue += parseFloat(rev._sum.pricePaid || 0);
      networkRevenue[network].orders += rev._count;
    }
  });

  // Get top performing agents/sub-agents
  const topSellers = await prisma.order.groupBy({
    by: ["sellerId"],
    where: { ...dateFilter, status: { in: ["completed", "processing"] } },
    _sum: {
      pricePaid: true,
      commissionAmount: true,
    },
    _count: true,
    orderBy: {
      _sum: {
        pricePaid: "desc",
      },
    },
    take: 10,
  });

  // Get seller details
  const sellerIds = topSellers.map((s) => s.sellerId);
  const sellers = await prisma.user.findMany({
    where: { id: { in: sellerIds } },
    select: { id: true, name: true, role: true },
  });

  const topSellersWithDetails = topSellers.map((seller) => {
    const sellerInfo = sellers.find((s) => s.id === seller.sellerId);
    return {
      sellerId: seller.sellerId,
      sellerName: sellerInfo?.name || "Unknown",
      sellerRole: sellerInfo?.role || "Unknown",
      totalRevenue: seller._sum.pricePaid || "0.00",
      totalCommission: seller._sum.commissionAmount || "0.00",
      totalOrders: seller._count,
    };
  });

  return {
    overview: {
      totalOrders,
      completedOrders,
      pendingOrders,
      processingOrders,
      failedOrders,
      totalRevenue: totalRevenue._sum.pricePaid || "0.00",
      totalCommissionsPaid:
        totalCommissionsPaid._sum.commissionAmount || "0.00",
      platformProfit:
        parseFloat(totalRevenue._sum.pricePaid || 0) -
        parseFloat(totalCommissionsPaid._sum.commissionAmount || 0),
      agentCount,
      subAgentCount,
      totalWalletBalance: totalWalletBalance._sum.balance || "0.00",
    },
    revenueByNetwork: Object.entries(networkRevenue).map(([network, data]) => ({
      network,
      revenue: data.revenue.toFixed(2),
      orders: data.orders,
    })),
    topSellers: topSellersWithDetails,
  };
};

/**
 * Get all wallet balances
 */
export const getAllWalletBalances = async (filters = {}) => {
  const prisma = getPrisma();
  const { role, minBalance, page = 1, limit = 50 } = filters;

  const skip = (page - 1) * limit;

  // Build where clause for users
  const userWhere = { role: { not: "admin" } };
  if (role && (role === "agent" || role === "sub_agent")) {
    userWhere.role = role;
  }

  // Get users with wallets
  const users = await prisma.user.findMany({
    where: userWhere,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      wallet: {
        select: {
          balance: true,
          totalCredited: true,
          totalDebited: true,
          updatedAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Filter by minimum balance if specified
  let filteredUsers = users.map((user) => ({
    userId: user.id,
    userName: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    balance: user.wallet?.balance || "0.00",
    totalCredited: user.wallet?.totalCredited || "0.00",
    totalDebited: user.wallet?.totalDebited || "0.00",
    lastTransaction: user.wallet?.updatedAt || null,
  }));

  if (minBalance) {
    filteredUsers = filteredUsers.filter(
      (user) => parseFloat(user.balance) >= parseFloat(minBalance),
    );
  }

  const total = filteredUsers.length;
  const paginatedUsers = filteredUsers.slice(skip, skip + limit);

  // Calculate total balances
  const totalBalance = filteredUsers.reduce(
    (sum, user) => sum + parseFloat(user.balance),
    0,
  );

  return {
    wallets: paginatedUsers,
    summary: {
      totalUsers: total,
      totalBalance: totalBalance.toFixed(2),
      averageBalance: (totalBalance / total || 0).toFixed(2),
    },
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get user details (for admin view)
 */
export const getUserDetails = async (userId) => {
  const prisma = getPrisma();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      paymentLinkCode: true,
      createdAt: true,
      wallet: {
        select: {
          balance: true,
          totalCredited: true,
          totalDebited: true,
          updatedAt: true,
        },
      },
      _count: {
        select: {
          orders: true,
          agentPrices: true,
          subAgentPrices: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Get order statistics
  const orderStats = await prisma.order.groupBy({
    by: ["status"],
    where: { sellerId: userId },
    _count: true,
    _sum: {
      pricePaid: true,
      commissionAmount: true,
    },
  });

  // Get recent orders
  const recentOrders = await prisma.order.findMany({
    where: { sellerId: userId },
    include: {
      bundle: {
        select: {
          network: true,
          volume: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // Get recent wallet transactions
  const recentTransactions = await prisma.walletTransaction.findMany({
    where: { walletId: user.wallet?.id || "" },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return {
    user: {
      ...user,
      walletBalance: user.wallet?.balance || "0.00",
      totalCredited: user.wallet?.totalCredited || "0.00",
      totalDebited: user.wallet?.totalDebited || "0.00",
      totalOrders: user._count.orders,
      totalPriceSettings: user._count.agentPrices + user._count.subAgentPrices,
    },
    orderStats: orderStats.map((stat) => ({
      status: stat.status,
      count: stat._count,
      totalRevenue: stat._sum.pricePaid || "0.00",
      totalCommission: stat._sum.commissionAmount || "0.00",
    })),
    recentOrders,
    recentTransactions,
  };
};

/**
 * Update bundle status (activate/deactivate)
 */
export const updateBundleStatus = async (bundleId, isActive) => {
  const prisma = getPrisma();

  const bundle = await prisma.dataBundle.findUnique({
    where: { id: bundleId },
  });

  if (!bundle) {
    throw new AppError("Bundle not found", 404);
  }

  const updatedBundle = await prisma.dataBundle.update({
    where: { id: bundleId },
    data: { isActive },
  });

  logger.info("Bundle status updated by admin", {
    bundleId,
    network: updatedBundle.network,
    volume: updatedBundle.volume,
    isActive,
  });

  return updatedBundle;
};

/**
 * Get failed orders for recovery
 */
export const getFailedOrders = async (page = 1, limit = 50) => {
  const prisma = getPrisma();
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { status: "failed" },
      include: {
        bundle: {
          select: {
            network: true,
            volume: true,
            hubnetCost: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            phone: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.order.count({ where: { status: "failed" } }),
  ]);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
