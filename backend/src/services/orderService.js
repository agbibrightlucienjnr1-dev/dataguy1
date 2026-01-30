import { getPrisma } from "../config/database.js";
import { AppError } from "../middlewares/errorHandler.js";
import { getDataBundleById } from "./dataBundleService.js";
import {
  processPaymentConfirmation,
  markOrderAsProcessing,
} from "./commissionService.js";
import { checkBalance, initiateDataTransaction } from "./hubnetService.js";
import { logger } from "../utils/logger.js";

/**
 * Create a new order (public purchase)
 */
export const createOrder = async (orderData) => {
  const prisma = getPrisma();
  const { customerPhone, customerName, bundleId, sellerId, sellerType } =
    orderData;

  // Validate seller exists
  const seller = await prisma.user.findUnique({
    where: { id: sellerId },
  });

  if (!seller) {
    throw new AppError("Seller not found", 404);
  }

  // Validate seller type matches user role
  if (
    (sellerType === "agent" && seller.role !== "agent") ||
    (sellerType === "sub_agent" && seller.role !== "sub_agent")
  ) {
    throw new AppError("Invalid seller type for this user", 400);
  }

  // Get bundle
  const bundle = await getDataBundleById(bundleId);

  if (!bundle.isActive) {
    throw new AppError("Bundle is not available", 400);
  }

  // Get pricing based on seller type
  let pricePaid;

  if (sellerType === "agent") {
    const agentPrice = await prisma.agentPrice.findUnique({
      where: {
        agentId_bundleId: {
          agentId: sellerId,
          bundleId,
        },
      },
    });

    if (!agentPrice) {
      throw new AppError("Agent has not set pricing for this bundle", 400);
    }

    pricePaid = agentPrice.customerPrice;
  } else {
    // sub_agent
    const subAgentPrice = await prisma.subAgentPrice.findUnique({
      where: {
        subAgentId_bundleId: {
          subAgentId: sellerId,
          bundleId,
        },
      },
    });

    if (!subAgentPrice) {
      throw new AppError("Sub-agent has not set pricing for this bundle", 400);
    }

    pricePaid = subAgentPrice.customerPrice;
  }

  // Create order
  const order = await prisma.order.create({
    data: {
      customerPhone,
      customerName,
      bundleId,
      sellerId,
      sellerType,
      pricePaid,
      status: "pending",
    },
    include: {
      bundle: true,
      seller: {
        select: {
          id: true,
          name: true,
          phone: true,
          role: true,
        },
      },
    },
  });

  return order;
};

/**
 * Get order by ID
 */
export const getOrderById = async (orderId) => {
  const prisma = getPrisma();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      bundle: true,
      seller: {
        select: {
          id: true,
          name: true,
          phone: true,
          role: true,
        },
      },
    },
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  return order;
};

/**
 * Get orders by seller (agent or sub-agent)
 */
export const getOrdersBySeller = async (sellerId, filters = {}) => {
  const prisma = getPrisma();
  const { status, startDate, endDate, page = 1, limit = 50 } = filters;

  const where = { sellerId };

  if (status) {
    where.status = status;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        bundle: true,
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
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get orders by customer phone
 */
export const getOrdersByCustomerPhone = async (customerPhone) => {
  const prisma = getPrisma();

  const orders = await prisma.order.findMany({
    where: { customerPhone },
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
    orderBy: { createdAt: "desc" },
  });

  return orders;
};

/**
 * Confirm payment and process commission
 */
export const confirmPayment = async (orderId, paymentReference) => {
  // Process payment confirmation and credit wallet
  const result = await processPaymentConfirmation(orderId, paymentReference);

  return result;
};

/**
 * Initiate Hubnet order (call this after payment confirmed)
 */
export const initiateHubnetOrder = async (orderId) => {
  const prisma = getPrisma();

  try {
    // Get order with bundle details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
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

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    // Order should be in payment_confirmed or failed status (allow retry for failed orders)
    if (order.status !== "payment_confirmed" && order.status !== "failed") {
      logger.warn("Order cannot be fulfilled", {
        orderId,
        status: order.status,
      });
      // If already processing or completed, just return
      if (order.status === "processing" || order.status === "completed") {
        return order;
      }
      // If still pending, payment wasn't confirmed yet
      if (order.status === "pending") {
        throw new AppError(
          "Payment must be confirmed before initiating Hubnet order",
          400,
        );
      }
      return order;
    }

    // Step 1: Check Hubnet balance
    logger.info("Checking Hubnet balance before initiating order", { orderId });
    const balanceCheck = await checkBalance();

    if (!balanceCheck.success) {
      throw new AppError("Failed to check Hubnet balance", 500);
    }

    logger.info("Hubnet balance check successful", {
      balance: balanceCheck.balance,
      currency: balanceCheck.currency,
    });

    // Step 2: Initiate Hubnet data transaction
    logger.info("Initiating Hubnet data transaction", {
      orderId,
      phone: order.customerPhone,
      network: order.bundle.network,
      volume: order.bundle.volume,
    });

    const hubnetTransaction = await initiateDataTransaction({
      phone: order.customerPhone,
      network: order.bundle.network,
      volume: order.bundle.volume,
      reference: order.id, // Use order ID as reference
      referrer: order.seller?.phone, // Optional: seller's phone for alerts
      webhookUrl: process.env.HUBNET_WEBHOOK_URL, // Optional: webhook for status updates
    });

    if (!hubnetTransaction.success) {
      throw new AppError("Failed to initiate Hubnet transaction", 500);
    }

    logger.success("Hubnet transaction initiated successfully", {
      orderId,
      hubnetTransactionId: hubnetTransaction.transactionId,
      hubnetPaymentId: hubnetTransaction.paymentId,
      code: hubnetTransaction.code,
    });

    // Code "0000" means Hubnet has received the order and will process it
    // Order stays as "processing" until we receive the delivery status via webhook
    // Webhook endpoint: POST /api/hubnet/webhook

    // Step 3: Store Hubnet reference and keep as processing
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "processing",
        hubnetOrderId: hubnetTransaction.transactionId,
        hubnetResponse: JSON.stringify({
          transactionId: hubnetTransaction.transactionId,
          paymentId: hubnetTransaction.paymentId,
          reference: hubnetTransaction.reference,
          message: hubnetTransaction.message,
          code: hubnetTransaction.code,
          ipAddress: hubnetTransaction.ipAddress,
          initiatedAt: new Date().toISOString(),
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

    logger.info("Order awaiting Hubnet delivery confirmation", {
      orderId,
      hubnetCode: hubnetTransaction.code,
      status: "processing",
    });

    return updatedOrder;
  } catch (error) {
    logger.error("Error initiating Hubnet order", {
      orderId,
      error: error.message,
    });

    // Update order with error information
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "failed",
        hubnetResponse: JSON.stringify({
          error: error.message,
          failedAt: new Date().toISOString(),
        }),
      },
    });

    throw error instanceof AppError
      ? error
      : new AppError("Failed to initiate Hubnet order", 500);
  }
};

/**
 * Update order status
 */
export const updateOrderStatus = async (
  orderId,
  status,
  additionalData = {},
) => {
  const prisma = getPrisma();

  const updateData = { status, ...additionalData };

  if (status === "completed") {
    updateData.completedAt = new Date();
  }

  const order = await prisma.order.update({
    where: { id: orderId },
    data: updateData,
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

/**
 * Update Hubnet tracking information
 */
export const updateHubnetTracking = async (orderId, hubnetData) => {
  const prisma = getPrisma();

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      hubnetOrderId: hubnetData.orderId,
      hubnetStatus: hubnetData.status,
      hubnetResponse: JSON.stringify(hubnetData.response),
    },
  });

  return order;
};

/**
 * Get seller statistics
 */
export const getSellerStats = async (sellerId) => {
  const prisma = getPrisma();

  const [totalOrders, completedOrders, pendingOrders, totalRevenue] =
    await Promise.all([
      prisma.order.count({
        where: { sellerId },
      }),
      prisma.order.count({
        where: { sellerId, status: "completed" },
      }),
      prisma.order.count({
        where: { sellerId, status: { in: ["pending", "payment_confirmed"] } },
      }),
      prisma.order.aggregate({
        where: { sellerId, status: "completed" },
        _sum: { pricePaid: true },
      }),
    ]);

  return {
    totalOrders,
    completedOrders,
    pendingOrders,
    totalRevenue: totalRevenue._sum.pricePaid || 0,
  };
};

/**
 * Track order by ID (public endpoint)
 */
export const trackOrderById = async (orderId) => {
  const prisma = getPrisma();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      bundle: {
        select: {
          network: true,
          volume: true,
        },
      },
      seller: {
        select: {
          name: true,
          phone: true,
        },
      },
    },
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  return {
    orderId: order.id,
    status: order.status,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    bundle: {
      network: order.bundle.network,
      volume: order.bundle.volume,
    },
    pricePaid: order.pricePaid,
    seller: {
      name: order.seller.name,
      phone: order.seller.phone,
    },
    createdAt: order.createdAt,
    completedAt: order.completedAt,
    paymentReference: order.paymentReference,
  };
};

/**
 * Track orders by phone number (public endpoint)
 */
export const trackOrdersByPhone = async (phone) => {
  const prisma = getPrisma();

  // Sanitize phone number (remove spaces, dashes)
  const sanitizedPhone = phone.replace(/[\s-]/g, "");

  const orders = await prisma.order.findMany({
    where: { customerPhone: sanitizedPhone },
    include: {
      bundle: {
        select: {
          network: true,
          volume: true,
        },
      },
      seller: {
        select: {
          name: true,
          phone: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20, // Limit to last 20 orders
  });

  if (!orders || orders.length === 0) {
    throw new AppError("No orders found for this phone number", 404);
  }

  return orders.map((order) => ({
    orderId: order.id,
    status: order.status,
    bundle: {
      network: order.bundle.network,
      volume: order.bundle.volume,
    },
    pricePaid: order.pricePaid,
    seller: {
      name: order.seller.name,
      phone: order.seller.phone,
    },
    createdAt: order.createdAt,
    completedAt: order.completedAt,
  }));
};
