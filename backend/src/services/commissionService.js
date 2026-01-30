import { getPrisma } from "../config/database.js";
import { AppError } from "../middlewares/errorHandler.js";
import { getOrCreateWallet } from "./walletService.js";

/**
 * Calculate commission for an order
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
    description = `Sub-agent commission for order ${order.id}`;
  } else {
    throw new AppError("Invalid seller type", 400);
  }

  return {
    commission,
    description,
    breakdown: {
      pricePaid: pricePaid,
      hubnetCost: hubnetCost,
      adminPrice: adminPrice,
      sellerCommission: commission,
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
      seller: true,
    },
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  // Check if already processed by looking for existing wallet transaction
  const existingTransaction = await prisma.walletTransaction.findUnique({
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
  const { commission, description } = await calculateCommission(order);

  // Get or create wallet first (outside transaction)
  const wallet = await getOrCreateWallet(order.sellerId);

  // Calculate new balance
  const balanceBefore = wallet.balance;
  const balanceAfter = balanceBefore.add(commission);

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

        // 2. Create wallet transaction
        const walletTransaction = await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: "commission",
            amount: commission,
            balanceBefore,
            balanceAfter,
            status: "completed",
            description,
            orderId,
            reference: paymentReference,
          },
        });

        // 3. Update wallet balance
        const updatedWallet = await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: balanceAfter,
            totalEarned: wallet.totalEarned.add(commission),
          },
        });

        return {
          order: updatedOrder,
          wallet: updatedWallet,
          transaction: walletTransaction,
        };
      },
      {
        maxWait: 10000, // 10 seconds
        timeout: 15000, // 15 seconds
      },
    );

    // If already processed inside transaction, fetch current state
    if (result.alreadyProcessed) {
      const existingTx = await prisma.walletTransaction.findUnique({
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
      const existingTx = await prisma.walletTransaction.findUnique({
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
