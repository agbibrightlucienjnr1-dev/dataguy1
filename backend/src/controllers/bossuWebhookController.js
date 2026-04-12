import { getPrisma } from "../config/database.js";
import { logger } from "../utils/logger.js";
import { incrementCustomerSuccessfulOrders } from "../services/customerService.js";

/**
 * Bossu Data Hub webhook handler
 * POST /api/bossu/webhook
 *
 * Bossu sends status updates when an order is completed, failed, or cancelled.
 * Payload:
 * {
 *   "event": "order.status_updated",
 *   "data": {
 *     "order_id": "EXT_...",
 *     "reference": "our-order-uuid",
 *     "status": "completed" | "failed" | "cancelled",
 *     "network": "mtn",
 *     "package_name": "1gb",
 *     "recipient_phone": "0241234567",
 *     "price": 3.95,
 *     "updated_at": "2026-03-30T12:00:00+00:00"
 *   }
 * }
 */
export const bossuWebhook = async (req, res) => {
  const prisma = getPrisma();

  try {
    logger.info("Bossu webhook received", { body: req.body });

    const event = req.headers["x-webhook-event"] || req.body.event;

    if (event !== "order.status_updated") {
      logger.warn("Unrecognized Bossu webhook event", { event });
      return res.status(200).json({ success: true, message: "Event ignored" });
    }

    const data = req.body.data || req.body;
    const {
      order_id: bossuOrderId,
      reference,
      status,
      network,
      package_name: packageName,
      recipient_phone: phone,
      price,
      updated_at: updatedAt,
    } = data;

    logger.info("Parsed Bossu webhook data", {
      bossuOrderId,
      reference,
      status,
      phone,
      network,
      packageName,
    });

    if (!reference && !bossuOrderId) {
      logger.error("Bossu webhook missing reference and order_id", {
        body: req.body,
      });
      return res.status(400).json({
        success: false,
        message: "Missing reference or order_id",
      });
    }

    // Find order by reference (our internal order UUID) or by providerOrderId
    let order;

    if (reference) {
      order = await prisma.order.findUnique({
        where: { id: reference },
        include: {
          bundle: true,
          seller: {
            select: { id: true, name: true, phone: true },
          },
        },
      });
    }

    if (!order && bossuOrderId) {
      order = await prisma.order.findFirst({
        where: { providerOrderId: bossuOrderId },
        include: {
          bundle: true,
          seller: {
            select: { id: true, name: true, phone: true },
          },
        },
      });
    }

    if (!order) {
      logger.error("Order not found for Bossu webhook", {
        reference,
        bossuOrderId,
      });
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    logger.info("Order found for Bossu webhook", {
      orderId: order.id,
      currentStatus: order.status,
      webhookStatus: status,
    });

    // Determine new status
    const successStatuses = ["completed", "success", "delivered"];
    const failedStatuses = ["failed", "error", "cancelled"];
    let newStatus;
    let deliveryTime = null;

    if (successStatuses.includes(status?.toLowerCase())) {
      newStatus = "completed";
      deliveryTime = new Date();
      logger.success("Bossu delivery successful", {
        orderId: order.id,
        status,
      });
    } else if (failedStatuses.includes(status?.toLowerCase())) {
      newStatus = "failed";
      logger.error("Bossu delivery failed", {
        orderId: order.id,
        status,
      });
    } else {
      logger.warn("Unknown Bossu status received", {
        orderId: order.id,
        status,
      });
      return res.status(200).json({
        success: true,
        message: "Webhook received but status not recognized",
      });
    }

    // Update order
    const updateData = {
      status: newStatus,
      providerResponse: JSON.stringify({
        provider: "bossu",
        webhookReceived: true,
        webhookTimestamp: new Date().toISOString(),
        bossuOrderId,
        status,
        phone,
        network,
        packageName,
        price,
        updatedAt,
        previousStatus: order.status,
      }),
    };

    if (deliveryTime) {
      updateData.completedAt = deliveryTime;
    }

    // Store the Bossu order ID if not already there
    if (bossuOrderId && !order.providerOrderId?.startsWith("DELIV-LOCK")) {
      // don't overwrite a real ID
    } else if (bossuOrderId) {
      updateData.providerOrderId = bossuOrderId;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: updateData,
      include: {
        bundle: true,
        seller: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    // Track successful customer deliveries
    if (newStatus === "completed" && order.status !== "completed") {
      await incrementCustomerSuccessfulOrders({
        customerPhone: updatedOrder.customerPhone,
        customerName: updatedOrder.customerName,
      });
    }

    logger.success("Order status updated from Bossu webhook", {
      orderId: updatedOrder.id,
      previousStatus: order.status,
      newStatus: updatedOrder.status,
      deliveryTime: deliveryTime?.toISOString(),
    });

    return res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
      orderId: updatedOrder.id,
      status: updatedOrder.status,
    });
  } catch (error) {
    logger.error("Error processing Bossu webhook", {
      error: error.message,
      stack: error.stack,
    });

    return res.status(200).json({
      success: false,
      message: "Webhook processing failed",
      error: error.message,
    });
  }
};
