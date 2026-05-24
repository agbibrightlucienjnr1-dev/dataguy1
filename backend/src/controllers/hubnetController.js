import { getPrisma } from "../config/database.js";
import { AppError } from "../middlewares/errorHandler.js";
import { logger } from "../utils/logger.js";
import { incrementCustomerSuccessfulOrders } from "../services/customerService.js";

/**
 * Hubnet webhook handler - ONLY source of truth for delivery status
 * This endpoint receives updates from Hubnet when data is delivered
 */
export const hubnetWebhook = async (req, res) => {
  const prisma = getPrisma();

  try {
    logger.info("Hubnet webhook received", { body: req.body });

    // Extract webhook data - Hubnet sends data nested in 'data' object
    const webhookData = req.body.data || req.body;
    const {
      reference,
      transaction_id,
      status: deliveryStatus,
      message: deliveryMessage,
      msisdn: phone,
      volume,
      network,
      timestamp,
    } = webhookData;

    // Extract top-level fields
    const {
      event,
      status: topLevelStatus,
      message: topLevelMessage,
      code,
    } = req.body;

    // Use nested status if available, otherwise use top-level
    const status = deliveryStatus || topLevelStatus;
    const message = deliveryMessage || topLevelMessage;

    logger.info("Parsed Hubnet webhook data", {
      event,
      reference,
      transaction_id,
      status,
      phone,
      volume,
      network,
    });

    // Validate required fields
    if (!reference && !transaction_id) {
      logger.error("Hubnet webhook missing reference and transaction_id", {
        body: req.body,
        parsedData: webhookData,
      });
      return res.status(400).json({
        success: false,
        message: "Missing reference or transaction_id",
      });
    }

    // Find order by reference (our order ID) or Hubnet transaction ID
    let order;

    if (reference) {
      order = await prisma.order.findFirst({
        where: { id: { startsWith: reference } },
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
    }

    // If not found by reference, try transaction_id
    if (!order && transaction_id) {
      order = await prisma.order.findFirst({
        where: { providerOrderId: transaction_id },
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
    }

    if (!order) {
      logger.error("Order not found for Hubnet webhook", {
        reference,
        transaction_id,
      });
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    logger.info("Order found for Hubnet webhook", {
      orderId: order.id,
      currentStatus: order.status,
      webhookStatus: status,
    });

    // Verify request authenticity by checking order details match
    const verificationErrors = [];

    if (phone && order.customerPhone !== phone) {
      verificationErrors.push(
        `Phone mismatch: expected ${order.customerPhone}, got ${phone}`,
      );
    }

    if (volume) {
      const expectedVolume = extractVolumeInMB(order.bundle.volume);
      const receivedVolume = parseInt(volume);
      const volumeDiff = Math.abs(expectedVolume - receivedVolume);
      const VOLUME_TOLERANCE_MB = 10; // Allow ±10MB difference for rounding

      if (volumeDiff > VOLUME_TOLERANCE_MB) {
        verificationErrors.push(
          `Volume mismatch: expected ${expectedVolume}MB, got ${receivedVolume}MB (diff: ${volumeDiff}MB)`,
        );
      }
    }

    if (network) {
      const hubnetNetwork = mapNetworkToHubnet(order.bundle.network);
      if (hubnetNetwork !== network.toLowerCase()) {
        verificationErrors.push(
          `Network mismatch: expected ${hubnetNetwork}, got ${network}`,
        );
      }
    }

    // Log verification errors but don't reject (Hubnet might send partial data)
    if (verificationErrors.length > 0) {
      logger.warn("Hubnet webhook data verification warnings", {
        orderId: order.id,
        errors: verificationErrors,
      });
    }

    // Determine new order status based on Hubnet status
    let newStatus;
    let deliveryTime = null;

    // Hubnet status can be: success, completed, delivered, failed, pending, processing
    const successStatuses = ["success", "completed", "delivered", "successful"];
    const failedStatuses = ["failed", "error", "cancelled"];

    if (
      successStatuses.some(
        (s) => status && status.toLowerCase().includes(s.toLowerCase()),
      )
    ) {
      newStatus = "completed";
      deliveryTime = new Date();
      logger.success("Hubnet delivery successful", {
        orderId: order.id,
        status,
      });
    } else if (
      failedStatuses.some(
        (s) => status && status.toLowerCase().includes(s.toLowerCase()),
      )
    ) {
      newStatus = "failed";
      logger.error("Hubnet delivery failed", { orderId: order.id, status });
      
      // Notify Admin
      import("../services/smsService.js").then(({ notifyAdminOfFailedOrder }) => {
        notifyAdminOfFailedOrder(order.id, "Hubnet Webhook", status || "Failed");
      }).catch(err => logger.error("Failed to load smsService", err));
    } else {
      // Unknown status, log but keep as processing
      logger.warn("Unknown Hubnet status received", {
        orderId: order.id,
        status,
      });
      return res.status(200).json({
        success: true,
        message: "Webhook received but status not recognized",
      });
    }

    // Update order status (ONLY source of truth for delivery)
    const updateData = {
      status: newStatus,
      providerResponse: JSON.stringify({
        webhookReceived: true,
        webhookTimestamp: new Date().toISOString(),
        status,
        message,
        transaction_id,
        phone,
        volume,
        network,
        timestamp,
        previousStatus: order.status,
      }),
    };

    if (deliveryTime) {
      updateData.completedAt = deliveryTime;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
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

    // Track successful customer deliveries in customer table to avoid duplicates
    if (newStatus === "completed" && order.status !== "completed") {
      await incrementCustomerSuccessfulOrders({
        customerPhone: updatedOrder.customerPhone,
        customerName: updatedOrder.customerName,
      });
    }

    logger.success("Order status updated from Hubnet webhook", {
      orderId: updatedOrder.id,
      previousStatus: order.status,
      newStatus: updatedOrder.status,
      deliveryTime: deliveryTime?.toISOString(),
    });

    // Send success response to Hubnet
    return res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
      orderId: updatedOrder.id,
      status: updatedOrder.status,
    });
  } catch (error) {
    logger.error("Error processing Hubnet webhook", {
      error: error.message,
      stack: error.stack,
    });

    // Return 200 to prevent Hubnet from retrying if it's our error
    // Return 500 if we want Hubnet to retry
    return res.status(200).json({
      success: false,
      message: "Webhook processing failed",
      error: error.message,
    });
  }
};

/**
 * Helper: Map network names to Hubnet format
 */
const mapNetworkToHubnet = (network) => {
  const networkMap = {
    MTN: "mtn",
    AIRTELTIGO: "big-time",
    AT: "at",
    TELECEL: "telecel",
  };
  return networkMap[network] || network.toLowerCase();
};

/**
 * Helper: Extract volume in MB from bundle volume string
 * Note: Uses decimal conversion (1GB = 1000MB) to match Hubnet API
 */
const extractVolumeInMB = (volumeString) => {
  const match = volumeString.match(/^(\d+(?:\.\d+)?)\s*(GB|MB)$/i);

  if (!match) {
    return null;
  }

  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();

  if (unit === "GB") {
    return Math.round(value * 1000); // Decimal: 1GB = 1000MB (matches hubnetService)
  } else {
    return Math.round(value);
  }
};

/**
 * Manual check delivery status endpoint (for debugging)
 */
export const checkDeliveryStatus = async (req, res) => {
  const prisma = getPrisma();

  try {
    const { orderId } = req.params;

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

    let hubnetData = null;
    if (order.providerResponse) {
      try {
        hubnetData = JSON.parse(order.providerResponse);
      } catch (e) {
        // Ignore parse errors
      }
    }

    res.status(200).json({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        customerPhone: order.customerPhone,
        customerName: order.customerName,
        bundle: {
          network: order.bundle.network,
          volume: order.bundle.volume,
        },
        pricePaid: order.pricePaid,
        createdAt: order.createdAt,
        completedAt: order.completedAt,
        hubnetOrderId: order.providerOrderId,
        hubnetData: hubnetData,
      },
    });
  } catch (error) {
    logger.error("Error checking delivery status", error);
    throw error;
  }
};
