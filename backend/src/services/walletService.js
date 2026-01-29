import { getPrisma } from "../config/database.js";
import { AppError } from "../middlewares/errorHandler.js";

/**
 * Get or create wallet for user
 */
export const getOrCreateWallet = async (userId) => {
  const prisma = getPrisma();

  let wallet = await prisma.wallet.findUnique({
    where: { userId },
  });

  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: { userId },
    });
  }

  return wallet;
};

/**
 * Get wallet by user ID
 */
export const getWalletByUserId = async (userId) => {
  const prisma = getPrisma();

  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
        },
      },
    },
  });

  if (!wallet) {
    throw new AppError("Wallet not found", 404);
  }

  return wallet;
};

/**
 * Credit wallet (add funds)
 */
export const creditWallet = async (userId, amount, transactionData = {}) => {
  const prisma = getPrisma();

  const {
    type = "commission",
    description,
    orderId,
    reference,
  } = transactionData;

  // Get or create wallet
  const wallet = await getOrCreateWallet(userId);

  // Calculate new balance
  const balanceBefore = wallet.balance;
  const balanceAfter = balanceBefore.add(amount);

  // Create transaction and update wallet in a transaction
  const result = await prisma.$transaction([
    // Create transaction record
    prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type,
        amount,
        balanceBefore,
        balanceAfter,
        status: "completed",
        description,
        orderId,
        reference,
      },
    }),
    // Update wallet balance
    prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: balanceAfter,
        totalEarned: wallet.totalEarned.add(amount),
      },
    }),
  ]);

  return {
    transaction: result[0],
    wallet: result[1],
  };
};

/**
 * Debit wallet (withdraw funds)
 */
export const debitWallet = async (userId, amount, transactionData = {}) => {
  const prisma = getPrisma();

  const { type = "withdrawal", description, reference } = transactionData;

  // Get wallet
  const wallet = await getOrCreateWallet(userId);

  // Check sufficient balance
  if (wallet.balance.lessThan(amount)) {
    throw new AppError("Insufficient wallet balance", 400);
  }

  // Calculate new balance
  const balanceBefore = wallet.balance;
  const balanceAfter = balanceBefore.sub(amount);

  // Create transaction and update wallet in a transaction
  const result = await prisma.$transaction([
    // Create transaction record
    prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type,
        amount: amount.neg(), // Negative amount for debit
        balanceBefore,
        balanceAfter,
        status: "completed",
        description,
        reference,
      },
    }),
    // Update wallet balance
    prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: balanceAfter,
        totalWithdrawn: wallet.totalWithdrawn.add(amount),
      },
    }),
  ]);

  return {
    transaction: result[0],
    wallet: result[1],
  };
};

/**
 * Get wallet transactions
 */
export const getWalletTransactions = async (userId, filters = {}) => {
  const prisma = getPrisma();

  const { type, startDate, endDate, page = 1, limit = 50 } = filters;

  // Get wallet
  const wallet = await getOrCreateWallet(userId);

  const where = { walletId: wallet.id };

  if (type) {
    where.type = type;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            customerPhone: true,
            status: true,
            pricePaid: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.walletTransaction.count({ where }),
  ]);

  return {
    transactions,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get wallet summary
 */
export const getWalletSummary = async (userId) => {
  const prisma = getPrisma();

  const wallet = await getOrCreateWallet(userId);

  // Get transaction stats
  const [commissionStats, withdrawalStats, transactionCount] =
    await Promise.all([
      prisma.walletTransaction.aggregate({
        where: {
          walletId: wallet.id,
          type: "commission",
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.walletTransaction.aggregate({
        where: {
          walletId: wallet.id,
          type: "withdrawal",
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.walletTransaction.count({
        where: { walletId: wallet.id },
      }),
    ]);

  return {
    balance: wallet.balance,
    totalEarned: wallet.totalEarned,
    totalWithdrawn: wallet.totalWithdrawn,
    commissions: {
      total: commissionStats._sum.amount || 0,
      count: commissionStats._count,
    },
    withdrawals: {
      total: Math.abs(withdrawalStats._sum.amount || 0),
      count: withdrawalStats._count,
    },
    totalTransactions: transactionCount,
  };
};
