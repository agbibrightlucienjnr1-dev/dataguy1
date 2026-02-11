import { getPrisma } from "../config/database.js";
import { AppError } from "../middlewares/errorHandler.js";
import { getOrCreateWallet } from "./walletService.js";
import { logger } from "../utils/logger.js";

/**
 * Calculate commission for an order
 * Returns commission for the seller, and optionally parent agent commission for sub-agent orders
 */
export const calculateCommission = async (order) => {
  const prisma = getPrisma();

  // Get bundle details
  const bundle = await prisma.dataBundle.findUnique({
    where: { id: order.bundleId },
  });

  if (!bundle) {
    throw new AppError("Bundle not found", 404);
  }

  const { hubnetCost, adminPrice } = bundle;
  const { sellerId, sellerType, pricePaid } = order;

  let commission;
  let description;
  let parentAgentCommission = null;
  let parentAgentId = null;
  let parentAgentDescription = null;

  if (sellerType === "agent") {
    // Agent commission = customer price - admin price
    commission = pricePaid - adminPrice;
    description = `Agent commission for order ${order.id}`;
  } else if (sellerType === "sub_agent") {
    // Get the parent agent's sub-agent price
    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
      include: {
        parentAgent: true,
      },
    });

    if (!seller || !seller.parentAgentId) {
      throw new AppError("Sub-agent parent not found", 404);
    }

    // Get agent's sub-agent price for this bundle
    const agentPrice = await prisma.agentPrice.findUnique({
      where: {
        agentId_bundleId: {
          agentId: seller.parentAgentId,
          bundleId: order.bundleId,
        },
      },
    });

    if (!agentPrice) {
      throw new AppError("Agent pricing not found", 404);
    }

    // Sub-agent commission = customer price - agent's sub-agent price
    commission = pricePaid - agentPrice.subAgentPrice;

    // Validate sub-agent commission is non-negative
    if (parseFloat(commission.toString()) < 0) {
      throw new AppError(
        "Invalid pricing: customer price is less than sub-agent price",
        400,
      );
    }

    description = `Sub-agent commission for order ${order.id}`;

    // Parent agent commission = agent's sub-agent price - admin price
    parentAgentCommission = agentPrice.subAgentPrice - adminPrice;

    // Validate parent agent commission is non-negative
    if (parseFloat(parentAgentCommission.toString()) < 0) {
      logger.warn("Parent agent commission is negative", {
        orderId: order.id,
        subAgentPrice: agentPrice.subAgentPrice.toString(),
        adminPrice: adminPrice.toString(),
        parentAgentCommission: parentAgentCommission.toString(),
      });
      // Set to null so it won't be processed (parent agent gets 0 commission)
      parentAgentCommission = null;
    }

    parentAgentId = seller.parentAgentId;
    parentAgentDescription = `Parent agent commission from sub-agent order ${order.id}`;
  } else {
    throw new AppError("Invalid seller type", 400);
  }

  // Validate seller commission is non-negative
  if (parseFloat(commission.toString()) < 0) {
    throw new AppError(
      "Invalid pricing: calculated commission is negative",
      400,
    );
  }

  return {
    commission,
    description,
    parentAgentCommission,
    parentAgentId,
    parentAgentDescription,
    breakdown: {
      pricePaid: pricePaid,
      hubnetCost: hubnetCost,
      adminPrice: adminPrice,
      sellerCommission: commission,
      parentAgentCommission: parentAgentCommission,
    },
  };
};

/**
 * Process payment confirmation and distribute commission
 */
export const processPaymentConfirmation = async (orderId, paymentReference) => {
  const prisma = getPrisma();

  // Get order with all details
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      bundle: true,
      seller: {
        include: {
          parentAgent: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  // Check if already processed by looking for existing wallet transaction
  const existingTransaction = await prisma.walletTransaction.findFirst({
    where: { orderId },
  });

  if (existingTransaction) {
    // Already processed - return the existing state
    const wallet = await prisma.wallet.findUnique({
      where: { id: existingTransaction.walletId },
    });
    return {
      order,
      wallet,
      transaction: existingTransaction,
      alreadyProcessed: true,
    };
  }

  if (order.status !== "pending") {
    throw new AppError(
      `Order cannot be confirmed. Current status: ${order.status}`,
      400,
    );
  }

  // Calculate commission
  let commission,
    description,
    parentAgentCommission,
    parentAgentId,
    parentAgentDescription;
  try {
    const commissionResult = await calculateCommission(order);
    commission = commissionResult.commission;
    description = commissionResult.description;
    parentAgentCommission = commissionResult.parentAgentCommission;
    parentAgentId = commissionResult.parentAgentId;
    parentAgentDescription = commissionResult.parentAgentDescription;
  } catch (error) {
    logger.error("Error calculating commission", {
      orderId,
      sellerType: order.sellerType,
      sellerId: order.sellerId,
      error: error.message,
    });
    throw error;
  }

  // Validate commission is not negative
  // Allow zero commission for special cases (e.g., promotional bundles or break-even pricing)
  if (parseFloat(commission.toString()) < 0) {
    logger.error("Negative commission calculated", {
      orderId,
      sellerType: order.sellerType,
      sellerId: order.sellerId,
      pricePaid: order.pricePaid.toString(),
      commission: commission.toString(),
    });
    throw new AppError("Invalid pricing: commission cannot be negative", 400);
  }

  // Log warning for zero commission but allow processing
  if (parseFloat(commission.toString()) === 0) {
    logger.warn("Processing order with zero commission", {
      orderId,
      sellerType: order.sellerType,
      sellerId: order.sellerId,
      pricePaid: order.pricePaid.toString(),
    });
  }

  // Get or create wallet first (outside transaction)
  const wallet = await getOrCreateWallet(order.sellerId);

  // Calculate new balance
  const balanceBefore = wallet.balance;
  const balanceAfter = balanceBefore.add(commission);

  // Get parent agent wallet if needed (outside transaction)
  let parentAgentWallet = null;
  let parentBalanceBefore = null;
  let parentBalanceAfter = null;
  if (
    parentAgentCommission !== null &&
    parentAgentId &&
    parseFloat(parentAgentCommission.toString()) > 0
  ) {
    try {
      parentAgentWallet = await getOrCreateWallet(parentAgentId);
      parentBalanceBefore = parentAgentWallet.balance;
      parentBalanceAfter = parentBalanceBefore.add(parentAgentCommission);
    } catch (error) {
      logger.error("Error getting parent agent wallet", {
        orderId,
        parentAgentId,
        error: error.message,
      });
      // If we can't get parent agent wallet, log but continue with seller commission only
      // This shouldn't happen, but we'll handle it gracefully
      parentAgentWallet = null;
    }
  }

  // Use transaction with increased timeout
  try {
    const result = await prisma.$transaction(
      async (tx) => {
        // Double-check order is still pending inside transaction
        const currentOrder = await tx.order.findUnique({
          where: { id: orderId },
        });

        if (currentOrder.status !== "pending") {
          // Already processed by another request
          return { alreadyProcessed: true, orderId };
        }

        // 1. Update order status to payment_confirmed
        const updatedOrder = await tx.order.update({
          where: { id: orderId },
          data: {
            status: "payment_confirmed",
            paymentReference,
            paymentConfirmedAt: new Date(),
            commissionAmount: commission,
            commissionPaid: true,
          },
        });

        // 2. Create wallet transaction for seller (sub-agent or agent)
        const walletTransaction = await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: "commission",
            amount: commission,
            balanceBefore,
            balanceAfter,
            status: "completed",
            description,
            orderId, // Link to order (unique constraint)
            reference: paymentReference,
          },
        });

        // 3. Update seller wallet balance
        const updatedWallet = await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: balanceAfter,
            totalEarned: wallet.totalEarned.add(commission),
          },
        });

        // 4. If sub-agent order, also credit parent agent
        let parentAgentTransaction = null;
        let updatedParentWallet = null;
        if (
          parentAgentCommission !== null &&
          parentAgentId &&
          parentAgentWallet &&
          parseFloat(parentAgentCommission.toString()) > 0
        ) {
          // Create wallet transaction for parent agent (without orderId since it's unique)
          parentAgentTransaction = await tx.walletTransaction.create({
            data: {
              walletId: parentAgentWallet.id,
              type: "commission",
              amount: parentAgentCommission,
              balanceBefore: parentBalanceBefore,
              balanceAfter: parentBalanceAfter,
              status: "completed",
              description: parentAgentDescription,
              // orderId is null - we can't link it since orderId is unique
              reference: `PARENT-${paymentReference}`,
            },
          });

          // Update parent agent wallet balance
          updatedParentWallet = await tx.wallet.update({
            where: { id: parentAgentWallet.id },
            data: {
              balance: parentBalanceAfter,
              totalEarned: parentAgentWallet.totalEarned.add(
                parentAgentCommission,
              ),
            },
          });
        }

        return {
          order: updatedOrder,
          wallet: updatedWallet,
          transaction: walletTransaction,
          parentAgentTransaction,
          parentAgentWallet: updatedParentWallet,
        };
      },
      {
        maxWait: 10000, // 10 seconds
        timeout: 15000, // 15 seconds
      },
    );

    // If already processed inside transaction, fetch current state
    if (result.alreadyProcessed) {
      const existingTx = await prisma.walletTransaction.findFirst({
        where: { orderId },
      });
      const walletState = existingTx
        ? await prisma.wallet.findUnique({ where: { id: existingTx.walletId } })
        : null;
      return {
        order,
        wallet: walletState,
        transaction: existingTx,
        alreadyProcessed: true,
      };
    }

    return result;
  } catch (error) {
    // Handle unique constraint violation (race condition with another request)
    if (error.code === "P2002" && error.meta?.target?.includes("order_id")) {
      const existingTx = await prisma.walletTransaction.findFirst({
        where: { orderId },
      });
      const walletState = existingTx
        ? await prisma.wallet.findUnique({ where: { id: existingTx.walletId } })
        : null;
      return {
        order,
        wallet: walletState,
        transaction: existingTx,
        alreadyProcessed: true,
      };
    }
    throw error;
  }
};

/**
 * Mark order as processing (after Hubnet API call initiated)
 */
export const markOrderAsProcessing = async (orderId) => {
  const prisma = getPrisma();

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "processing",
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

  return order;
};
