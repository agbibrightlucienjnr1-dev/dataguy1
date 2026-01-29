import { getPrisma } from "../config/database.js";
import { AppError } from "../middlewares/errorHandler.js";
import { getDataBundleById } from "./dataBundleService.js";

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
 * Update order payment status
 */
export const confirmPayment = async (orderId, paymentReference) => {
  const prisma = getPrisma();

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "payment_confirmed",
      paymentReference,
      paymentConfirmedAt: new Date(),
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
