import { getPrisma } from "../config/database.js";
import { AppError } from "../middlewares/errorHandler.js";
import { getDataBundleById } from "./dataBundleService.js";
import {
  processPaymentConfirmation,
  markOrderAsProcessing,
} from "./commissionService.js";
import { checkBalance, initiateDataTransaction } from "./hubnetService.js";
import { upsertCustomerOnOrderPlacement } from "./customerService.js";
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

  // Upsert customer record for this phone (prevents duplicates and tracks orders)
  await upsertCustomerOnOrderPlacement({
    customerPhone,
    customerName,
    orderCreatedAt: new Date(),
  });

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

  // Send automated SMS if this is newly processed
  if (!result.alreadyProcessed && result.order) {
    const { order } = result;
    try {
      const { sendSMS } = await import("./smsService.js");
      const agentUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/buy/${order.seller.paymentLinkCode}`;
      
      const message = `Your payment for ${order.bundle.network} ${order.bundle.volume} is confirmed! We truly appreciate your trust in DataGuy. Keep enjoying seamless connectivity. Reorder anytime: ${agentUrl}`;
      
      // Dispatch asynchronously without awaiting to prevent blocking the flow
      sendSMS(order.customerPhone, message).catch(err => {
        logger.error("Failed to send order confirmation SMS", { orderId, error: err.message });
      });
    } catch (err) {
      logger.error("Error setting up confirmation SMS", { orderId, error: err.message });
    }
  }

  return result;
};

/**
 * Initiate Hubnet order (call this after payment confirmed)
 */
export const initiateHubnetOrder = async (orderId) => {
  const prisma = getPrisma();

  logger.info("=== initiateHubnetOrder START ===", { orderId });

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

    logger.info("initiateHubnetOrder - Order loaded", {
      orderId,
      status: order.status,
      hubnetOrderId: order.hubnetOrderId,
      customerPhone: order.customerPhone,
      network: order.bundle?.network,
      volume: order.bundle?.volume,
    });

    // CRITICAL: Prevent duplicate Hubnet orders
    // Order should be in payment_confirmed or failed status (allow retry for failed orders)
    if (order.status !== "payment_confirmed" && order.status !== "failed") {
      logger.warn("Order cannot be fulfilled - invalid status", {
        orderId,
        status: order.status,
        hubnetOrderId: order.hubnetOrderId,
      });
      // If already processing or completed, just return (already sent to Hubnet)
      if (order.status === "processing" || order.status === "completed") {
        logger.info("Order already sent to Hubnet, skipping", {
          orderId,
          status: order.status,
          hubnetOrderId: order.hubnetOrderId,
        });
        return order;
      }
      // If still pending, payment wasn't confirmed yet
      if (order.status === "pending") {
        logger.error("Cannot send to Hubnet - payment not confirmed", {
          orderId,
          status: order.status,
        });
        throw new AppError(
          "Payment must be confirmed before initiating Hubnet order",
          400,
        );
      }
      return order;
    }

    // Additional check: If hubnetOrderId already exists, order was already sent to Hubnet
    if (order.hubnetOrderId) {
      logger.info(
        "Order already has Hubnet transaction ID, skipping duplicate send",
        {
          orderId,
          status: order.status,
          hubnetOrderId: order.hubnetOrderId,
        },
      );
      return order;
    }

    // STEP 1: Generate a unique lock ID and ATOMICALLY claim this order BEFORE calling Hubnet
    // This prevents duplicate Hubnet calls even if multiple requests come in simultaneously
    const lockId = `LOCK-${orderId}-${Date.now()}`;
    logger.info("Attempting to acquire lock", { orderId, lockId });

    const lockResult = await prisma.order.updateMany({
      where: {
        id: orderId,
        status: {
          in: ["payment_confirmed", "failed"],
        },
        hubnetOrderId: null, // Only lock if not already locked/sent
      },
      data: {
        hubnetOrderId: lockId, // Set lock ID immediately
        status: "processing",
      },
    });

    logger.info("Lock acquisition result", {
      orderId,
      lockId,
      count: lockResult.count,
    });

    // If no rows updated, another request already locked/processed this order
    if (lockResult.count === 0) {
      logger.warn(
        "Order already locked by another request, skipping Hubnet call",
        {
          orderId,
          attemptedLockId: lockId,
        },
      );

      // Return current order state
      const currentOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          bundle: true,
          seller: {
            select: { id: true, name: true, phone: true },
          },
        },
      });
      return currentOrder;
    }

    logger.info("Order locked for Hubnet processing", {
      orderId,
      lockId,
    });

    // Log that we're about to send to Hubnet
    logger.info("SENDING ORDER TO HUBNET", {
      orderId,
      status: "processing",
      customerPhone: order.customerPhone,
      network: order.bundle.network,
      volume: order.bundle.volume,
    });

    try {
      // Step 2: Check Hubnet balance
      logger.info("Checking Hubnet balance before initiating order", {
        orderId,
      });
      const balanceCheck = await checkBalance();

      if (!balanceCheck.success) {
        throw new AppError("Failed to check Hubnet balance", 500);
      }

      logger.info("Hubnet balance check successful", {
        balance: balanceCheck.balance,
        currency: balanceCheck.currency,
      });

      // Step 3: Initiate Hubnet data transaction
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

      // Step 4: Update order with actual Hubnet transaction ID
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          hubnetOrderId: hubnetTransaction.transactionId || lockId, // Use Hubnet ID or keep lock ID
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
            select: { id: true, name: true, phone: true },
          },
        },
      });

      logger.info("Order awaiting Hubnet delivery confirmation", {
        orderId,
        hubnetCode: hubnetTransaction.code,
        hubnetOrderId: updatedOrder.hubnetOrderId,
        status: "processing",
      });

      return updatedOrder;
    } catch (hubnetError) {
      // Hubnet call failed - mark order as failed but KEEP the lock ID to prevent retries
      logger.error("Hubnet API call failed", {
        orderId,
        lockId,
        error: hubnetError.message,
      });

      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "failed",
          hubnetOrderId: null, // Clear lock to allow retry
          hubnetResponse: JSON.stringify({
            error: hubnetError.message,
            failedAt: new Date().toISOString(),
            lockId: lockId,
          }),
        },
      });

      throw hubnetError;
    }
  } catch (error) {
    logger.error("Error initiating Hubnet order", {
      orderId,
      error: error.message,
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
  }));
};
