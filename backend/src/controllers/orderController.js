import { asyncHandler } from "../middlewares/errorHandler.js";
import { getPrisma } from "../config/database.js";
import {
  createOrder,
  getOrderById,
  getOrdersBySeller,
  getOrdersByCustomerPhone,
  getSellerStats,
  trackOrderById,
  trackOrdersByPhone,
} from "../services/orderService.js";
import {
  getSellerByCode,
  getBundlesWithSellerPricing,
  createOrderFromLink,
} from "../services/publicOrderService.js";
import { AppError } from "../middlewares/errorHandler.js";
import { validatePhone } from "../utils/validators.js";

/**
 * Create a new order (Public endpoint)
 * POST /api/orders/purchase
 */
export const createPurchase = asyncHandler(async (req, res) => {
  const { customerPhone, customerName, bundleId, sellerId, sellerType } =
    req.body;

  // Validate required fields
  if (!customerPhone || !bundleId || !sellerId || !sellerType) {
    throw new AppError(
      "Customer phone, bundle ID, seller ID, and seller type are required",
      400,
    );
  }

  // Validate phone number
  if (!validatePhone(customerPhone)) {
    throw new AppError("Invalid phone number format", 400);
  }

  // Validate seller type
  if (!["agent", "sub_agent"].includes(sellerType)) {
    throw new AppError("Seller type must be 'agent' or 'sub_agent'", 400);
  }

  const order = await createOrder({
    customerPhone,
    customerName,
    bundleId,
    sellerId,
    sellerType,
  });

  res.status(201).json({
    success: true,
    message: "Order created successfully. Please proceed with payment.",
    data: { order },
  });
});

/**
 * Get order by ID (Public - for customers to track)
 * GET /api/orders/:id
 */
export const getOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await getOrderById(id);

  res.status(200).json({
    success: true,
    data: { order },
  });
});

/**
 * Get orders by customer phone (Public - for customers)
 * GET /api/orders/customer/:phone
 */
export const getCustomerOrders = asyncHandler(async (req, res) => {
  const { phone } = req.params;

  if (!validatePhone(phone)) {
    throw new AppError("Invalid phone number format", 400);
  }

  const orders = await getOrdersByCustomerPhone(phone);

  res.status(200).json({
    success: true,
    data: { orders, count: orders.length },
  });
});

/**
 * Get seller's orders (Protected - agents and sub-agents)
 * GET /api/orders/seller/my-orders
 */
export const getMyOrders = asyncHandler(async (req, res) => {
  const sellerId = req.user.id;
  const { status, startDate, endDate, page, limit } = req.query;

  const result = await getOrdersBySeller(sellerId, {
    status,
    startDate,
    endDate,
    page: page ? parseInt(page) : undefined,
    limit: limit ? parseInt(limit) : undefined,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * Get seller statistics (Protected - agents and sub-agents)
 * GET /api/orders/seller/stats
 */
export const getMyStats = asyncHandler(async (req, res) => {
  const sellerId = req.user.id;

  const stats = await getSellerStats(sellerId);

  res.status(200).json({
    success: true,
    data: { stats },
  });
});

/**
 * Get seller info from payment link code (Public)
 * GET /api/orders/link/:code
 */
export const getSellerInfo = asyncHandler(async (req, res) => {
  const { code } = req.params;

  const seller = await getSellerByCode(code);

  res.status(200).json({
    success: true,
    data: { seller },
  });
});

/**
 * Get bundles with seller's pricing (Public)
 * GET /api/orders/link/:code/bundles
 */
export const getLinkBundles = asyncHandler(async (req, res) => {
  const { code } = req.params;

  const result = await getBundlesWithSellerPricing(code);

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * Create order from payment link (Public)
 * POST /api/orders/link/:code/purchase
 */
export const purchaseFromLink = asyncHandler(async (req, res) => {
  const { code } = req.params;
  const { customerPhone, paymentNumber, network, customerName, bundleId } = req.body;

  // Validate required fields
  if (!customerPhone || !bundleId) {
    throw new AppError("Customer phone and bundle ID are required", 400);
  }

  // Validate phone number
  if (!validatePhone(customerPhone)) {
    throw new AppError("Invalid phone number format", 400);
  }

  const result = await createOrderFromLink(code, {
    customerPhone,
    paymentNumber: paymentNumber || customerPhone,
    network,
    customerName,
    bundleId,
  });

  res.status(201).json({
    success: true,
    message: "Order created successfully. Please proceed with payment.",
    data: result, // Contains both order and payment data
  });
});

/**
 * Track order by ID (Public)
 * GET /api/orders/track/:orderId
 */
export const trackOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await trackOrderById(orderId);

  res.status(200).json({
    success: true,
    data: order,
  });
});

/**
 * Track orders by phone number (Public)
 * GET /api/orders/track/phone/:phone
 */
export const trackOrdersByPhoneNumber = asyncHandler(async (req, res) => {
  const { phone } = req.params;

  // Validate phone number
  if (!validatePhone(phone)) {
    throw new AppError("Invalid phone number format", 400);
  }

  const orders = await trackOrdersByPhone(phone);

  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders,
  });
});

/**
 * Get public platform stats (Public)
 * GET /api/orders/public/stats
 */
export const getPublicStats = asyncHandler(async (req, res) => {
  const prisma = getPrisma();

  const [agentCount, subAgentCount, completedOrders, failedOrders] = await Promise.all([
    prisma.user.count({ where: { role: "agent" } }),
    prisma.user.count({ where: { role: "sub_agent" } }),
    prisma.order.count({ where: { status: "completed" } }),
    prisma.order.count({ where: { status: "failed" } }),
  ]);

  const successRate = (completedOrders + failedOrders) > 0
    ? ((completedOrders / (completedOrders + failedOrders)) * 100).toFixed(1)
    : "99.9";

  res.status(200).json({
    success: true,
    data: {
      activeAgents: agentCount + subAgentCount,
      ordersDelivered: completedOrders,
      successRate: parseFloat(successRate),
    },
  });
});
