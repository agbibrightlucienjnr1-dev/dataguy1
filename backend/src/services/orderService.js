import { getPrisma } from "../config/database.js";
import { AppError } from "../middlewares/errorHandler.js";
import { getDataBundleById } from "./dataBundleService.js";
import {
  processPaymentConfirmation,
  markOrderAsProcessing,
} from "./commissionService.js";
import { checkBalance as hubnetCheckBalance, initiateDataTransaction as hubnetInitiateTransaction } from "./hubnetService.js";
import { checkBalance as bossuCheckBalance, initiateDataTransaction as bossuInitiateTransaction } from "./bossuService.js";
import { getActiveDeliveryProvider } from "./settingsService.js";
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

      const networkDisplayMap = {
        MTN: "MTN",
        TELECEL: "Telecel",
        AT: "AT iSHARE",
        AIRTELTIGO: "Big Time",
      };
      const displayNetworkName = networkDisplayMap[order.bundle.network] || order.bundle.network;

      const message = `Your payment for ${displayNetworkName} ${order.bundle.volume} is confirmed! We truly appreciate your trust in DataGuy. Keep enjoying seamless connectivity. Reorder anytime on our website: ${agentUrl}.`;

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
 * Initiate delivery order via the active provider (Hubnet or Bossu)
 * Call this after payment is confirmed.
 */
export const initiateDeliveryOrder = async (orderId) => {
  const prisma = getPrisma();

  // Determine which provider to use
  let activeProvider;
  try {
    activeProvider = await getActiveDeliveryProvider();
  } catch {
    activeProvider = "hubnet"; // fallback
  }

  logger.info("=== initiateDeliveryOrder START ===", { orderId, activeProvider });

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

    logger.info("initiateDeliveryOrder - Order loaded", {
      orderId,
      status: order.status,
      providerOrderId: order.providerOrderId,
      customerPhone: order.customerPhone,
      network: order.bundle?.network,
      volume: order.bundle?.volume,
    });

    // CRITICAL: Prevent duplicate delivery orders
    if (order.status !== "payment_confirmed" && order.status !== "failed") {
      logger.warn("Order cannot be fulfilled - invalid status", {
        orderId,
        status: order.status,
        providerOrderId: order.providerOrderId,
      });
      if (order.status === "processing" || order.status === "completed") {
        logger.info("Order already sent to provider, skipping", {
          orderId,
          status: order.status,
          providerOrderId: order.providerOrderId,
        });
        return order;
      }
      if (order.status === "pending") {
        logger.error("Cannot send to provider - payment not confirmed", {
          orderId,
          status: order.status,
        });
        throw new AppError(
          "Payment must be confirmed before initiating delivery order",
          400,
        );
      }
      return order;
    }

    // Additional check: If providerOrderId already exists, order was already sent
    if (order.providerOrderId) {
      logger.info(
        "Order already has provider transaction ID, skipping duplicate send",
        {
          orderId,
          status: order.status,
          providerOrderId: order.providerOrderId,
        },
      );
      return order;
    }

    // STEP 1: Generate a unique lock ID and ATOMICALLY claim this order
    const lockId = `DELIV-LOCK-${orderId}-${Date.now()}`;
    logger.info("Attempting to acquire delivery lock", { orderId, lockId });

    const lockResult = await prisma.order.updateMany({
      where: {
        id: orderId,
        status: {
          in: ["payment_confirmed", "failed"],
        },
        providerOrderId: null,
      },
      data: {
        providerOrderId: lockId,
        deliveryProvider: activeProvider,
        status: "processing",
      },
    });

    logger.info("Delivery lock acquisition result", {
      orderId,
      lockId,
      count: lockResult.count,
    });

    if (lockResult.count === 0) {
      logger.warn(
        "Order already locked by another request, skipping delivery call",
        {
          orderId,
          attemptedLockId: lockId,
        },
      );

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

    logger.info(`Order locked for ${activeProvider} processing`, {
      orderId,
      lockId,
    });

    logger.info(`SENDING ORDER TO ${activeProvider.toUpperCase()}`, {
      orderId,
      status: "processing",
      customerPhone: order.customerPhone,
      network: order.bundle.network,
      volume: order.bundle.volume,
    });

    try {
      // Step 2: Check provider balance
      const checkBalance = activeProvider === "bossu" ? bossuCheckBalance : hubnetCheckBalance;
      logger.info(`Checking ${activeProvider} balance before initiating order`, { orderId });
      const balanceCheck = await checkBalance();

      if (!balanceCheck.success) {
        throw new AppError(`Failed to check ${activeProvider} balance`, 500);
      }

      logger.info(`${activeProvider} balance check successful`, {
        balance: balanceCheck.balance,
        currency: balanceCheck.currency,
      });

      // Step 3: Initiate data transaction via the active provider
      const initiateTransaction = activeProvider === "bossu" ? bossuInitiateTransaction : hubnetInitiateTransaction;

      logger.info(`Initiating ${activeProvider} data transaction`, {
        orderId,
        phone: order.customerPhone,
        network: order.bundle.network,
        volume: order.bundle.volume,
      });

      const txParams = {
        phone: order.customerPhone,
        network: order.bundle.network,
        volume: order.bundle.volume,
        reference: order.id,
      };

      if (activeProvider === "bossu") {
        txParams.webhookUrl = process.env.BOSSU_WEBHOOK_URL;
      } else {
        txParams.referrer = order.seller?.phone;
        txParams.webhookUrl = process.env.HUBNET_WEBHOOK_URL;
      }

      const providerTransaction = await initiateTransaction(txParams);

      if (!providerTransaction.success) {
        throw new AppError(`Failed to initiate ${activeProvider} transaction`, 500);
      }

      logger.success(`${activeProvider} transaction initiated successfully`, {
        orderId,
        transactionId: providerTransaction.transactionId,
      });

      // Step 4: Update order with actual provider transaction ID
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          providerOrderId: providerTransaction.transactionId || lockId,
          providerResponse: JSON.stringify({
            provider: activeProvider,
            transactionId: providerTransaction.transactionId,
            paymentId: providerTransaction.paymentId,
            reference: providerTransaction.reference,
            message: providerTransaction.message,
            code: providerTransaction.code,
            ipAddress: providerTransaction.ipAddress,
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

      logger.info(`Order awaiting ${activeProvider} delivery confirmation`, {
        orderId,
        providerOrderId: updatedOrder.providerOrderId,
        status: "processing",
      });

      return updatedOrder;
    } catch (providerError) {
      // Provider call failed - mark as failed and clear lock to allow retry
      logger.error(`${activeProvider} API call failed`, {
        orderId,
        lockId,
        error: providerError.message,
      });

      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "failed",
          providerOrderId: null,
          providerResponse: JSON.stringify({
            provider: activeProvider,
            error: providerError.message,
            failedAt: new Date().toISOString(),
            lockId: lockId,
          }),
        },
      });

      // Send SMS alert to Admin
      import("./smsService.js").then(({ notifyAdminOfFailedOrder }) => {
        notifyAdminOfFailedOrder(orderId, activeProvider, providerError.message);
      }).catch(err => logger.error("Failed to load smsService for admin notification", err));

      throw providerError;
    }
  } catch (error) {
    logger.error("Error initiating delivery order", {
      orderId,
      error: error.message,
    });

    throw error instanceof AppError
      ? error
      : new AppError("Failed to initiate delivery order", 500);
  }
};

// Backwards-compatible alias so existing callers (paymentController, etc.) don't break
export const initiateHubnetOrder = initiateDeliveryOrder;

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
 * Update provider tracking information
 */
export const updateHubnetTracking = async (orderId, hubnetData) => {
  const prisma = getPrisma();

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      providerOrderId: hubnetData.orderId,
      providerStatus: hubnetData.status,
      providerResponse: JSON.stringify(hubnetData.response),
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
    status: order.status === "failed" ? "processing" : order.status,
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
    status: order.status === "failed" ? "processing" : order.status,
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
