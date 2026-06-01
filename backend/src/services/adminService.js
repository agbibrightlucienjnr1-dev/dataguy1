import { getPrisma } from "../config/database.js";
import { AppError } from "../middlewares/errorHandler.js";
import { logger } from "../utils/logger.js";
import { Prisma } from "@prisma/client";

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

  // Define today and this month for specific metrics
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayFilter = { createdAt: { gte: today } };

  const startOfMonth = new Date(today);
  startOfMonth.setDate(1);
  const thisMonthFilter = { createdAt: { gte: startOfMonth } };

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
    todayOrdersCount,
    todayRevenueAgg,
    pendingWithdrawalsCount,
    pendingWithdrawalAmountAgg,
    activeSellersGroups,
    thisMonthRevenueAgg,
    thisMonthCommissionsPaidAgg
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
    // Additional metrics for UI
    prisma.order.count({ where: { ...todayFilter } }),
    prisma.order.aggregate({
      where: { ...todayFilter, status: { in: ["completed", "processing"] } },
      _sum: { pricePaid: true },
    }),
    prisma.withdrawal.count({ where: { status: "pending" } }),
    prisma.withdrawal.aggregate({
      where: { status: "pending" },
      _sum: { amount: true },
    }),
    prisma.order.groupBy({
      by: ["sellerId"],
      where: { ...dateFilter },
    }),
    prisma.order.aggregate({
      where: { ...thisMonthFilter, status: { in: ["completed", "processing"] } },
      _sum: { pricePaid: true },
    }),
    prisma.order.aggregate({
      where: {
        ...thisMonthFilter,
        status: { in: ["completed", "processing"] },
        commissionPaid: true,
      },
      _sum: { commissionAmount: true },
    })
  ]);

  // Get revenue breakdown by network (used for platformProfit too)
  const [revenueByNetwork, thisMonthRevenueByNetwork] = await Promise.all([
    prisma.order.groupBy({
      by: ["bundleId"],
      where: { ...dateFilter, status: { in: ["completed", "processing"] } },
      _sum: {
        pricePaid: true,
      },
      _count: true,
    }),
    prisma.order.groupBy({
      by: ["bundleId"],
      where: { ...thisMonthFilter, status: { in: ["completed", "processing"] } },
      _sum: {
        pricePaid: true,
      },
      _count: true,
    }),
  ]);

  // Get bundle info for revenue breakdown and hubnetCost
  const allBundleIds = [
    ...revenueByNetwork.map((r) => r.bundleId),
    ...thisMonthRevenueByNetwork.map((r) => r.bundleId),
  ];
  const uniqueBundleIds = [...new Set(allBundleIds)];

  const bundles = await prisma.dataBundle.findMany({
    where: { id: { in: uniqueBundleIds } },
    select: { id: true, network: true, volume: true, hubnetCost: true },
  });

  let totalHubnetCost = 0;
  const networkRevenue = {};
  
  revenueByNetwork.forEach((rev) => {
    const bundle = bundles.find((b) => b.id === rev.bundleId);
    if (bundle) {
      // Add up wholesale hubnet costs
      totalHubnetCost += parseFloat(bundle.hubnetCost || 0) * rev._count;
      
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

  let thisMonthHubnetCost = 0;
  thisMonthRevenueByNetwork.forEach((rev) => {
    const bundle = bundles.find((b) => b.id === rev.bundleId);
    if (bundle) {
      thisMonthHubnetCost += parseFloat(bundle.hubnetCost || 0) * rev._count;
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

  const successRate = (completedOrders + failedOrders) > 0 ? ((completedOrders / (completedOrders + failedOrders)) * 100).toFixed(1) : 0;

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
        ((parseFloat(totalRevenue._sum.pricePaid || 0) -
        parseFloat(totalCommissionsPaid._sum.commissionAmount || 0) -
        totalHubnetCost) * 0.97).toFixed(2),
      thisMonthRevenue: thisMonthRevenueAgg._sum.pricePaid || "0.00",
      thisMonthProfit:
        ((parseFloat(thisMonthRevenueAgg._sum.pricePaid || 0) -
        parseFloat(thisMonthCommissionsPaidAgg._sum.commissionAmount || 0) -
        thisMonthHubnetCost) * 0.97).toFixed(2),
      agentCount,
      subAgentCount,
      totalUsers: agentCount + subAgentCount,
      totalWalletBalance: totalWalletBalance._sum.balance || "0.00",
      todayOrders: todayOrdersCount,
      todayRevenue: todayRevenueAgg._sum.pricePaid || "0.00",
      pendingWithdrawals: pendingWithdrawalsCount,
      pendingWithdrawalAmount: pendingWithdrawalAmountAgg._sum.amount || "0.00",
      activeAgents: activeSellersGroups.length,
      successRate: parseFloat(successRate)
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

/**
 * Generate platform report data for analytics charts
 */
export const generateReportData = async () => {
  const prisma = getPrisma();
  
  // Calculate 30 days ago
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  // 1. Fetch daily aggregated orders
  const dailyOrders = await prisma.order.groupBy({
    by: ['createdAt'], // Group by raw createdAt to parse in JS because SQLite/Pg might differ for date truncation
    where: {
      status: { in: ['completed', 'processing'] },
      createdAt: { gte: thirtyDaysAgo },
    },
    _sum: { pricePaid: true },
    _count: true,
  });

  // Aggregate by day string (YYYY-MM-DD)
  const salesMap = {};
  for (let i = 0; i <= 30; i++) {
    const d = new Date(thirtyDaysAgo);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    salesMap[dateStr] = {
      date: dateStr,
      revenue: 0,
      orders: 0
    };
  }

  dailyOrders.forEach(order => {
    const dStr = new Date(order.createdAt).toISOString().split("T")[0];
    if (salesMap[dStr]) {
      salesMap[dStr].revenue += parseFloat(order._sum.pricePaid || 0);
      salesMap[dStr].orders += order._count;
    }
  });

  const salesTrend = Object.values(salesMap).sort((a,b) => a.date.localeCompare(b.date));

  // 2. Fetch Volume Distribution (Only MTN as per user request)
  const volumeDistributionReq = await prisma.order.groupBy({
    by: ['bundleId'],
    where: {
      status: { in: ['completed', 'processing'] },
      createdAt: { gte: thirtyDaysAgo },
      bundle: { network: "MTN" } // Enforce MTN only!
    },
    _count: true
  });

  const bundleIds = volumeDistributionReq.map(v => v.bundleId);
  const bundles = await prisma.dataBundle.findMany({
    where: { id: { in: bundleIds } },
    select: { id: true, volume: true }
  });

  const tempVolMap = {};
  volumeDistributionReq.forEach(vol => {
    const b = bundles.find(bun => bun.id === vol.bundleId);
    if (b) {
      const volName = b.volume;
      tempVolMap[volName] = (tempVolMap[volName] || 0) + vol._count;
    }
  });

  const volumeDistribution = Object.entries(tempVolMap).map(([name, value]) => ({
    name,
    value
  }));

  // Combine top-level overview just as a quick snapshot
  const [totalOrders, totalRevenue, completedOrders, failedOrders] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.order.aggregate({
      where: {
        status: { in: ['completed', 'processing'] },
        createdAt: { gte: thirtyDaysAgo },
      },
      _sum: { pricePaid: true }
    }),
    prisma.order.count({
      where: {
        status: 'completed',
        createdAt: { gte: thirtyDaysAgo },
      }
    }),
    prisma.order.count({
      where: {
        status: 'failed',
        createdAt: { gte: thirtyDaysAgo },
      }
    }),
  ]);

  const successRate = (completedOrders + failedOrders) > 0 ? ((completedOrders / (completedOrders + failedOrders)) * 100).toFixed(1) : 0;

  return {
    salesTrend,
    volumeDistribution,
    overview: {
      totalVolume: totalOrders,
      totalRevenue: parseFloat(totalRevenue._sum.pricePaid || 0).toFixed(2),
      successRate: parseFloat(successRate)
    }
  };
};

/**
 * Get system profit analysis data for a given month and year
 */
export const getProfitAnalysisData = async (month, year) => {
  const prisma = getPrisma();
  
  // Construct dates for the selected month
  const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const endDate = new Date(year, month, 1, 0, 0, 0, 0); // exclusive boundary

  // 1. Fetch system settings
  const settings = await prisma.systemSettings.findUnique({
    where: { id: "global" }
  }) || {
    hubnetDepositFeePercentage: 3.0
  };

  const hubnetDepositFeePercentage = parseFloat(settings.hubnetDepositFeePercentage?.toString() || "3.0");

  // 2. Fetch completed/processing orders in that month
  const orders = await prisma.order.findMany({
    where: {
      status: { in: ["completed", "processing"] },
      createdAt: {
        gte: startDate,
        lt: endDate
      }
    },
    include: {
      bundle: {
        select: {
          network: true,
          volume: true,
          hubnetCost: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  // 3. Fetch PlatformExpenses in that month
  const expenses = await prisma.platformExpense.findMany({
    where: {
      date: {
        gte: startDate,
        lt: endDate
      }
    },
    orderBy: {
      date: "desc"
    }
  });

  // 3.5 Fetch completed withdrawals in that month
  const withdrawals = await prisma.withdrawal.findMany({
    where: {
      status: "completed",
      completedAt: {
        gte: startDate,
        lt: endDate
      }
    }
  });

  // 4. Calculate individual order costs & profit
  let totalGrossCollected = 0;
  let totalGatewayFees = 0;
  let totalNetSettlement = 0;
  let totalWholesaleCosts = 0;
  let totalCommissions = 0;

  const networkBreakdown = {};

  const ledger = orders.map((order) => {
    const pricePaid = parseFloat(order.pricePaid || 0);
    const transactionFee = parseFloat(order.transactionFee || 0);
    const grossCollected = pricePaid + transactionFee;
    
    // Calculate Gateway Fee
    // Paystack charges 2% for each transaction.
    // Moolre charges 0.5 or 1% depending on which is higher.
    let gatewayFee = 0;
    const provider = (order.paymentProvider || "paystack").toLowerCase();
    if (provider === "paystack") {
      gatewayFee = grossCollected * 0.02;
    } else {
      // moolre or other
      gatewayFee = Math.max(0.5, grossCollected * 0.01);
    }

    const netSettlement = grossCollected - gatewayFee;
    const commission = parseFloat(order.commissionAmount || 0);
    const hubnetCost = parseFloat(order.bundle?.hubnetCost || 0);
    
    // Apply wholesale deposit markup
    const hubnetDepositFee = hubnetCost * (hubnetDepositFeePercentage / 100);
    const actualHubnetCost = hubnetCost + hubnetDepositFee;

    const netProfit = netSettlement - actualHubnetCost - commission;

    totalGrossCollected += grossCollected;
    totalGatewayFees += gatewayFee;
    totalNetSettlement += netSettlement;
    totalWholesaleCosts += actualHubnetCost;
    totalCommissions += commission;

    // Accumulate Network Breakdown
    const network = order.bundle?.network || "UNKNOWN";
    if (!networkBreakdown[network]) {
      networkBreakdown[network] = {
        network,
        orders: 0,
        grossCollected: 0,
        gatewayFee: 0,
        netSettlement: 0,
        actualHubnetCost: 0,
        commission: 0,
        netProfit: 0
      };
    }
    networkBreakdown[network].orders += 1;
    networkBreakdown[network].grossCollected += grossCollected;
    networkBreakdown[network].gatewayFee += gatewayFee;
    networkBreakdown[network].netSettlement += netSettlement;
    networkBreakdown[network].actualHubnetCost += actualHubnetCost;
    networkBreakdown[network].commission += commission;
    networkBreakdown[network].netProfit += netProfit;

    return {
      id: order.id,
      createdAt: order.createdAt,
      customerPhone: order.customerPhone,
      network,
      volume: order.bundle?.volume || "N/A",
      paymentProvider: order.paymentProvider,
      grossCollected: grossCollected.toFixed(2),
      gatewayFee: gatewayFee.toFixed(2),
      commission: commission.toFixed(2),
      actualHubnetCost: actualHubnetCost.toFixed(2),
      netProfit: netProfit.toFixed(2)
    };
  });

  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
  
  let totalWithdrawalFees = 0;
  withdrawals.forEach((w) => {
    const amount = parseFloat(w.amount || 0);
    // Moolre charges 0.5 or 1% depending on which is higher
    const fee = Math.max(0.5, amount * 0.01);
    totalWithdrawalFees += fee;
  });

  const totalNetProfit = totalNetSettlement - totalWholesaleCosts - totalCommissions - totalExpenses - totalWithdrawalFees;

  // Format network breakdown decimals
  const networkBreakdownArray = Object.values(networkBreakdown).map((net) => ({
    ...net,
    grossCollected: net.grossCollected.toFixed(2),
    gatewayFee: net.gatewayFee.toFixed(2),
    netSettlement: net.netSettlement.toFixed(2),
    actualHubnetCost: net.actualHubnetCost.toFixed(2),
    commission: net.commission.toFixed(2),
    netProfit: net.netProfit.toFixed(2)
  }));

  // Clean formatted overview
  const overview = {
    totalGrossCollected: totalGrossCollected.toFixed(2),
    totalGatewayFees: totalGatewayFees.toFixed(2),
    totalNetSettlement: totalNetSettlement.toFixed(2),
    totalWholesaleCosts: totalWholesaleCosts.toFixed(2),
    totalCommissions: totalCommissions.toFixed(2),
    totalExpenses: totalExpenses.toFixed(2),
    totalWithdrawalFees: totalWithdrawalFees.toFixed(2),
    totalNetProfit: totalNetProfit.toFixed(2)
  };

  // Calculate overall/all-time stats
  const allOrders = await prisma.order.findMany({
    where: {
      status: { in: ["completed", "processing"] }
    },
    select: {
      pricePaid: true,
      transactionFee: true,
      paymentProvider: true,
      commissionAmount: true,
      bundle: {
        select: {
          hubnetCost: true
        }
      }
    }
  });

  const allExpensesSum = await prisma.platformExpense.aggregate({
    _sum: {
      amount: true
    }
  });
  const totalAllTimeExpenses = parseFloat(allExpensesSum._sum.amount || 0);

  const allWithdrawals = await prisma.withdrawal.findMany({
    where: {
      status: "completed"
    },
    select: {
      amount: true
    }
  });

  let overallGrossCollected = 0;
  let overallGatewayFees = 0;
  let overallNetSettlement = 0;
  let overallWholesaleCosts = 0;
  let overallCommissions = 0;

  allOrders.forEach((order) => {
    const pricePaid = parseFloat(order.pricePaid || 0);
    const transactionFee = parseFloat(order.transactionFee || 0);
    const grossCollected = pricePaid + transactionFee;

    let gatewayFee = 0;
    const provider = (order.paymentProvider || "paystack").toLowerCase();
    if (provider === "paystack") {
      gatewayFee = grossCollected * 0.02;
    } else {
      gatewayFee = Math.max(0.5, grossCollected * 0.01);
    }

    const netSettlement = grossCollected - gatewayFee;
    const commission = parseFloat(order.commissionAmount || 0);
    const hubnetCost = parseFloat(order.bundle?.hubnetCost || 0);
    const hubnetDepositFee = hubnetCost * (hubnetDepositFeePercentage / 100);
    const actualHubnetCost = hubnetCost + hubnetDepositFee;

    overallGrossCollected += grossCollected;
    overallGatewayFees += gatewayFee;
    overallNetSettlement += netSettlement;
    overallWholesaleCosts += actualHubnetCost;
    overallCommissions += commission;
  });

  let overallWithdrawalFees = 0;
  allWithdrawals.forEach((w) => {
    const amount = parseFloat(w.amount || 0);
    const fee = Math.max(0.5, amount * 0.01);
    overallWithdrawalFees += fee;
  });

  const overallNetProfit = overallNetSettlement - overallWholesaleCosts - overallCommissions - totalAllTimeExpenses - overallWithdrawalFees;

  const overall = {
    totalGrossCollected: overallGrossCollected.toFixed(2),
    totalGatewayFees: overallGatewayFees.toFixed(2),
    totalNetSettlement: overallNetSettlement.toFixed(2),
    totalWholesaleCosts: overallWholesaleCosts.toFixed(2),
    totalCommissions: overallCommissions.toFixed(2),
    totalExpenses: totalAllTimeExpenses.toFixed(2),
    totalWithdrawalFees: overallWithdrawalFees.toFixed(2),
    totalNetProfit: overallNetProfit.toFixed(2)
  };

  return {
    overview,
    overall,
    expenses: expenses.map(exp => ({
      ...exp,
      amount: parseFloat(exp.amount || 0).toFixed(2)
    })),
    networkBreakdown: networkBreakdownArray,
    ledger
  };
};

/**
 * Create a new platform expense
 */
export const createPlatformExpense = async (data) => {
  const prisma = getPrisma();
  const { category, amount, description, date } = data;

  const expense = await prisma.platformExpense.create({
    data: {
      category,
      amount: new Prisma.Decimal(amount.toString()),
      description,
      date: date ? new Date(date) : new Date(),
    }
  });

  logger.info("Platform expense created", { id: expense.id, category, amount });
  return expense;
};

/**
 * Delete a platform expense
 */
export const deletePlatformExpense = async (id) => {
  const prisma = getPrisma();
  
  const expense = await prisma.platformExpense.delete({
    where: { id }
  });

  logger.info("Platform expense deleted", { id });
  return expense;
};
