import { getPrisma } from "../config/database.js";
import { AppError } from "../middlewares/errorHandler.js";
import { creditWallet } from "./walletService.js";

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

  if (order.status !== "pending") {
    throw new AppError(
      `Order cannot be confirmed. Current status: ${order.status}`,
      400,
    );
  }

  // Calculate commission
  const { commission, description } = await calculateCommission(order);

  // Use transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    // 1. Update order status to payment_confirmed
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        status: "payment_confirmed",
        paymentReference,
        paymentConfirmedAt: new Date(),
        commissionAmount: commission,
      },
    });

    // 2. Credit seller's wallet
    const walletCredit = await creditWallet(order.sellerId, commission, {
      type: "commission",
      description,
      orderId,
      reference: paymentReference,
    });

    // 3. Mark commission as paid
    await tx.order.update({
      where: { id: orderId },
      data: { commissionPaid: true },
    });

    return {
      order: updatedOrder,
      wallet: walletCredit.wallet,
      transaction: walletCredit.transaction,
    };
  });

  return result;
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
