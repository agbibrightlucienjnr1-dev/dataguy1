import { getPrisma } from "../config/database.js";
import { AppError } from "../middlewares/errorHandler.js";
import { logger } from "../utils/logger.js";
import { debitWallet } from "./walletService.js";
import {
  createTransferRecipient,
  initiateTransfer,
  verifyTransfer,
} from "./paystackTransferService.js";
import { createId } from "@paralleldrive/cuid2";

const MINIMUM_WITHDRAWAL = 10; // 10 GHS

/**
 * Create withdrawal request
 */
export const createWithdrawalRequest = async (userId, withdrawalData) => {
  const prisma = getPrisma();
  const {
    amount,
    accountType,
    accountNumber,
    accountName,
    bankName,
    bankCode,
    mobileNetwork,
  } = withdrawalData;

  // Validate minimum withdrawal
  if (parseFloat(amount) < MINIMUM_WITHDRAWAL) {
    throw new AppError(
      `Minimum withdrawal amount is GH₵${MINIMUM_WITHDRAWAL}`,
      400,
    );
  }

  // Get user's wallet
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
  });

  if (!wallet) {
    throw new AppError("Wallet not found", 404);
  }

  // Check if user has sufficient balance
  if (parseFloat(wallet.balance) < parseFloat(amount)) {
    throw new AppError(
      `Insufficient balance. Available: GH₵${wallet.balance}`,
      400,
    );
  }

  // Check for pending withdrawals
  const pendingWithdrawal = await prisma.withdrawal.findFirst({
    where: {
      userId,
      status: { in: ["pending", "approved", "processing"] },
    },
  });

  if (pendingWithdrawal) {
    throw new AppError(
      "You have a pending withdrawal request. Please wait for it to be processed.",
      400,
    );
  }

  // Generate unique reference
  const reference = `WDL-${createId()}`;

  // Create withdrawal request
  const withdrawal = await prisma.withdrawal.create({
    data: {
      userId,
      amount,
      accountType,
      accountNumber,
      accountName,
      bankName,
      mobileNetwork,
      status: "pending",
      reference,
    },
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

  logger.info("Withdrawal request created", {
    withdrawalId: withdrawal.id,
    userId,
    amount,
    reference,
  });

  return withdrawal;
};

/**
 * Get user withdrawals
 */
export const getUserWithdrawals = async (userId, filters = {}) => {
  const prisma = getPrisma();
  const { status, page = 1, limit = 20 } = filters;

  const skip = (page - 1) * limit;
  const where = { userId };

  if (status) {
    where.status = status;
  }

  const [withdrawals, total] = await Promise.all([
    prisma.withdrawal.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.withdrawal.count({ where }),
  ]);

  return {
    withdrawals,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get all withdrawals (admin)
 */
export const getAllWithdrawals = async (filters = {}) => {
  const prisma = getPrisma();
  const { status, userId, page = 1, limit = 50 } = filters;

  const skip = (page - 1) * limit;
  const where = {};

  if (status) {
    where.status = status;
  }

  if (userId) {
    where.userId = userId;
  }

  const [withdrawals, total] = await Promise.all([
    prisma.withdrawal.findMany({
      where,
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
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.withdrawal.count({ where }),
  ]);

  return {
    withdrawals,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Approve withdrawal and initiate transfer (admin)
 */
export const approveWithdrawal = async (withdrawalId, adminId) => {
  const prisma = getPrisma();

  return await prisma.$transaction(async (tx) => {
    // Get withdrawal
    const withdrawal = await tx.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            wallet: true,
          },
        },
      },
    });

    if (!withdrawal) {
      throw new AppError("Withdrawal not found", 404);
    }

    if (withdrawal.status !== "pending") {
      throw new AppError(
        `Withdrawal cannot be approved. Current status: ${withdrawal.status}`,
        400,
      );
    }

    // Check if user still has sufficient balance
    if (
      parseFloat(withdrawal.user.wallet.balance) < parseFloat(withdrawal.amount)
    ) {
      throw new AppError("User has insufficient balance", 400);
    }

    // Update withdrawal status to approved
    const approvedWithdrawal = await tx.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: "approved",
        approvedBy: adminId,
        approvedAt: new Date(),
      },
    });

    logger.info("Withdrawal approved", {
      withdrawalId,
      adminId,
      amount: withdrawal.amount,
    });

    // Initiate Paystack transfer
    try {
      // 1. Create transfer recipient if not exists
      let recipientCode = withdrawal.paystackRecipientCode;

      if (!recipientCode) {
        const recipientType =
          withdrawal.accountType === "mobile_money" ? "mobile_money" : "ghipss";

        const recipient = await createTransferRecipient({
          type: recipientType,
          name: withdrawal.accountName,
          accountNumber: withdrawal.accountNumber,
          bankCode: withdrawal.bankName || withdrawal.mobileNetwork || "MTN", // For mobile money
          currency: "GHS",
        });

        recipientCode = recipient.recipientCode;

        // Update withdrawal with recipient code
        await tx.withdrawal.update({
          where: { id: withdrawalId },
          data: { paystackRecipientCode: recipientCode },
        });
      }

      // 2. Initiate transfer
      const transfer = await initiateTransfer({
        amount: withdrawal.amount,
        recipient: recipientCode,
        reference: withdrawal.reference,
        reason: `Withdrawal for ${withdrawal.user.name}`,
      });

      // 3. Debit wallet
      await debitWallet(withdrawal.userId, withdrawal.amount, {
        type: "withdrawal",
        reference: withdrawal.reference,
        description: `Withdrawal to ${withdrawal.accountType === "mobile_money" ? "mobile money" : "bank account"}`,
      });

      // 4. Update withdrawal with transfer details
      const updatedWithdrawal = await tx.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: "processing",
          paystackTransferCode: transfer.transferCode,
          paystackResponse: JSON.stringify(transfer.transferData),
          processedAt: new Date(),
        },
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

      logger.success("Transfer initiated for withdrawal", {
        withdrawalId,
        transferCode: transfer.transferCode,
        reference: withdrawal.reference,
      });

      return updatedWithdrawal;
    } catch (error) {
      // If transfer fails, revert approval
      await tx.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: "pending",
          approvedBy: null,
          approvedAt: null,
        },
      });

      logger.error("Failed to initiate transfer", error);
      throw new AppError(
        "Failed to initiate transfer. Please try again later.",
        500,
      );
    }
  });
};

/**
 * Reject withdrawal (admin)
 */
export const rejectWithdrawal = async (withdrawalId, adminId, reason) => {
  const prisma = getPrisma();

  const withdrawal = await prisma.withdrawal.findUnique({
    where: { id: withdrawalId },
  });

  if (!withdrawal) {
    throw new AppError("Withdrawal not found", 404);
  }

  if (withdrawal.status !== "pending") {
    throw new AppError(
      `Withdrawal cannot be rejected. Current status: ${withdrawal.status}`,
      400,
    );
  }

  const updatedWithdrawal = await prisma.withdrawal.update({
    where: { id: withdrawalId },
    data: {
      status: "rejected",
      approvedBy: adminId,
      approvedAt: new Date(),
      adminNote: reason,
    },
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

  logger.info("Withdrawal rejected", {
    withdrawalId,
    adminId,
    reason,
  });

  return updatedWithdrawal;
};

/**
 * Process transfer webhook (update withdrawal status)
 */
export const processTransferWebhook = async (webhookData) => {
  const prisma = getPrisma();
  const { event, data } = webhookData;

  const reference = data.reference;
  const status = data.status;

  // Find withdrawal by reference
  const withdrawal = await prisma.withdrawal.findUnique({
    where: { reference },
  });

  if (!withdrawal) {
    logger.warn("Withdrawal not found for transfer webhook", { reference });
    return { success: false, message: "Withdrawal not found" };
  }

  // Update withdrawal status based on transfer status
  let newStatus;

  if (event === "transfer.success" || status === "success") {
    newStatus = "completed";
  } else if (event === "transfer.failed" || status === "failed") {
    newStatus = "failed";
  } else if (event === "transfer.reversed" || status === "reversed") {
    newStatus = "failed";
    // TODO: Credit wallet back for reversed transfers
  }

  if (newStatus) {
    const updatedWithdrawal = await prisma.withdrawal.update({
      where: { id: withdrawal.id },
      data: {
        status: newStatus,
        completedAt: newStatus === "completed" ? new Date() : null,
        paystackResponse: JSON.stringify(data),
      },
    });

    logger.success("Withdrawal status updated from webhook", {
      withdrawalId: withdrawal.id,
      previousStatus: withdrawal.status,
      newStatus,
      event,
    });

    return { success: true, withdrawal: updatedWithdrawal };
  }

  return { success: true, message: "No status update needed" };
};

/**
 * Get withdrawal statistics
 */
export const getWithdrawalStatistics = async (userId = null) => {
  const prisma = getPrisma();

  const where = userId ? { userId } : {};

  const [
    totalWithdrawals,
    pendingWithdrawals,
    completedWithdrawals,
    totalAmount,
    completedAmount,
  ] = await Promise.all([
    prisma.withdrawal.count({ where }),
    prisma.withdrawal.count({ where: { ...where, status: "pending" } }),
    prisma.withdrawal.count({ where: { ...where, status: "completed" } }),
    prisma.withdrawal.aggregate({
      where,
      _sum: { amount: true },
    }),
    prisma.withdrawal.aggregate({
      where: { ...where, status: "completed" },
      _sum: { amount: true },
    }),
  ]);

  return {
    totalWithdrawals,
    pendingWithdrawals,
    completedWithdrawals,
    totalAmount: totalAmount._sum.amount || "0.00",
    completedAmount: completedAmount._sum.amount || "0.00",
  };
};
