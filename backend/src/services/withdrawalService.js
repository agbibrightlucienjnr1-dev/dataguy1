import { getPrisma } from "../config/database.js";
import { AppError } from "../middlewares/errorHandler.js";
import { logger } from "../utils/logger.js";
import { debitWalletInTransaction } from "./walletService.js";
import { getSystemSettings } from "./settingsService.js";
import {
  createTransferRecipient,
  initiateTransfer,
  verifyTransfer,
} from "./paystackTransferService.js";
import { initiateMoolreTransfer } from "./moolreService.js";
import { creditWallet } from "./walletService.js";
import { createId } from "@paralleldrive/cuid2";
import { Prisma } from "@prisma/client";

const MINIMUM_WITHDRAWAL = 10; // 10 GHS

/**
 * Handle automatic withdrawal via Moolre MMo Transfer
 */
export const processAutomaticWithdrawal = async (userId, withdrawalData) => {
  const prisma = getPrisma();

  // Check if withdrawals are temporarily disabled due to network disruptions
  const settings = await getSystemSettings();
  if (settings.disableWithdrawals) {
    throw new AppError("Withdrawals are temporarily disabled due to current network disruptions. You cannot request new payouts at this time.", 403);
  }

  const {
    amount,
    accountNumber,
    accountName,
    mobileNetwork,
  } = withdrawalData;

  // Validate minimum withdrawal
  if (parseFloat(amount) < MINIMUM_WITHDRAWAL) {
    throw new AppError(
      `Minimum withdrawal amount is GH₵${MINIMUM_WITHDRAWAL}`,
      400,
    );
  }

  // Generate unique reference
  const reference = `WDL-${createId()}`;

  // Execute safe debit and record creation in a transaction block
  const withdrawal = await prisma.$transaction(async (tx) => {
    // 1. Get user's wallet
    let wallet = await tx.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new AppError("Wallet not found", 404);
    }

    // 2. Check sufficient balance
    if (parseFloat(wallet.balance) < parseFloat(amount)) {
      throw new AppError(
        `Insufficient balance. Available: GH₵${wallet.balance}`,
        400,
      );
    }

    // 3. Check for pending/processing withdrawals to prevent concurrent processing spam
    const pendingWithdrawal = await tx.withdrawal.findFirst({
      where: {
        userId,
        status: { in: ["pending", "processing"] },
      },
    });

    if (pendingWithdrawal) {
      throw new AppError(
        "You have a pending withdrawal request being processed. Please wait.",
        400,
      );
    }

    // 4. Debit Wallet (Throws on insufficient balance)
    await debitWalletInTransaction(tx, userId, new Prisma.Decimal(amount), {
      type: "withdrawal",
      reference,
      description: `Withdrawal to mobile money`,
    });

    // 5. Create processing withdrawal record
    return await tx.withdrawal.create({
      data: {
        userId,
        amount,
        accountType: "mobile_money",
        accountNumber,
        accountName,
        mobileNetwork,
        status: "processing", 
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
  });

  logger.info("Withdrawal request created, initiating auto-transfer", {
    withdrawalId: withdrawal.id,
    userId,
    amount,
    reference,
  });

  // Call Moolre Transfer API
  try {
    const transferResponse = await initiateMoolreTransfer({
      amount,
      network: mobileNetwork,
      accountNumber,
      reference,
      reason: `Commission Withdrawal for ${withdrawal.user.name}`
    });

    const newStatus = transferResponse.status === "success" 
      ? "completed" 
      : transferResponse.status === "failed" 
        ? "failed" 
        : "processing";

    // Update Withdrawal Record
    const updatedWithdrawal = await prisma.withdrawal.update({
      where: { id: withdrawal.id },
      data: {
        status: newStatus,
        paystackTransferCode: transferResponse.transferCode || transferResponse.transactionid || null, 
        paystackResponse: Array.isArray(transferResponse.message) ? transferResponse.message.join("; ") : transferResponse.message, 
        completedAt: newStatus === "completed" ? new Date() : null,
        processedAt: new Date()
      }
    });

    // If instantly failed (Status 2), Refund wallet
    if (newStatus === "failed") {
      logger.error("Moolre transfer aborted/failed instantly. Refunding wallet.", { reference });
      await creditWallet(userId, amount, {
        type: "refund",
        reference: `REF-${reference}`,
        description: `Refund for failed withdrawal ${reference}`
      });
    }

    return updatedWithdrawal;
  } catch (error) {
    logger.error("Moolre transfer threw an exception.", error);
    
    // If Moolre explicitly rejected it (e.g., Insufficient Balance), we can safely refund immediately.
    if (error.statusCode === 400) {
      const failedWithdrawal = await prisma.withdrawal.update({
        where: { id: withdrawal.id },
        data: {
          status: "failed",
          adminNote: `Moolre Rejected: ${error.message}`
        }
      });
      
      await creditWallet(userId, amount, {
        type: "refund",
        reference: `REF-${reference}`,
        description: `Refund for Moolre rejection: ${reference}`
      });

      // Pass the error back up to inform the UI that it failed completely
      throw new AppError(`Transfer rejected: ${error.message}`, 400);
    }

    // For 500s or network timeouts, Moolre MIGHT still process it, so leave it as processing.
    await prisma.withdrawal.update({
      where: { id: withdrawal.id },
      data: {
        adminNote: `API Exception: ${error.message}`
      }
    });
    
    return withdrawal;
  }
};

/**
 * Get user withdrawals
 */
export const getUserWithdrawals = async (userId, filters = {}) => {
  const prisma = getPrisma();
  const { status } = filters;
  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 20;

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
  const { status, userId } = filters;
  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 50;

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
 * @param {string} withdrawalId - Withdrawal ID
 * @param {string} adminId - Admin user ID
 * @param {boolean} manualMode - If true, skip Paystack and mark for manual processing
 */
export const approveWithdrawal = async (
  withdrawalId,
  adminId,
  manualMode = false,
) => {
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
      manualMode,
    });

    // If manual mode, just mark as approved for manual processing
    if (manualMode) {
      // Debit wallet immediately for manual processing (using transaction client)
      await debitWalletInTransaction(
        tx,
        withdrawal.userId,
        withdrawal.amount,
        {
          type: "withdrawal",
          reference: withdrawal.reference,
          description: `Withdrawal to ${withdrawal.accountType === "mobile_money" ? "mobile money" : "bank account"} (manual)`,
        },
      );

      const updatedWithdrawal = await tx.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: "processing",
          adminNote: "Manual processing - awaiting external transfer",
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

      logger.success("Withdrawal approved for manual processing", {
        withdrawalId,
        reference: withdrawal.reference,
      });

      return updatedWithdrawal;
    }

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

      // 3. Debit wallet (using transaction client)
      await debitWalletInTransaction(
        tx,
        withdrawal.userId,
        withdrawal.amount,
        {
          type: "withdrawal",
          reference: withdrawal.reference,
          description: `Withdrawal to ${withdrawal.accountType === "mobile_money" ? "mobile money" : "bank account"}`,
        },
      );

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
 * Complete withdrawal manually (admin) - for manual transfers done outside Paystack
 */
export const completeWithdrawalManually = async (
  withdrawalId,
  adminId,
  note = null,
) => {
  const prisma = getPrisma();

  const withdrawal = await prisma.withdrawal.findUnique({
    where: { id: withdrawalId },
  });

  if (!withdrawal) {
    throw new AppError("Withdrawal not found", 404);
  }

  if (withdrawal.status !== "processing") {
    throw new AppError(
      `Only processing withdrawals can be completed manually. Current status: ${withdrawal.status}`,
      400,
    );
  }

  const updatedWithdrawal = await prisma.withdrawal.update({
    where: { id: withdrawalId },
    data: {
      status: "completed",
      completedAt: new Date(),
      adminNote: note || "Completed manually by admin",
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

  logger.success("Withdrawal completed manually", {
    withdrawalId,
    adminId,
    amount: withdrawal.amount,
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
