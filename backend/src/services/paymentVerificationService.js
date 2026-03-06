import { getPrisma } from "../config/database.js";
import { verifyTransaction } from "./paystackService.js";
import { confirmPayment, initiateHubnetOrder } from "./orderService.js";
import { logger } from "../utils/logger.js";

/**
 * Payment Verification Service
 *
 * This service provides robust payment verification to ensure no payments are missed,
 * even if the webhook fails or the customer takes time to complete the payment.
 */

/**
 * Get pending orders that may need payment verification
 * @param {Object} options - Options for filtering pending orders
 * @param {number} options.minAgeMinutes - Minimum age of order in minutes (default: 1)
 * @param {number} options.maxAgeHours - Maximum age of order in hours (default: 24)
 * @param {number} options.limit - Maximum number of orders to return (default: 50)
 */
export const getPendingOrdersForVerification = async (options = {}) => {
  const prisma = getPrisma();
  const {
    minAgeMinutes = 1, // Only check orders at least 1 minute old (give webhook time to process)
    maxAgeHours = 24, // Don't check orders older than 24 hours
    limit = 50,
  } = options;

  const now = new Date();
  const minCreatedAt = new Date(now.getTime() - maxAgeHours * 60 * 60 * 1000);
  const maxCreatedAt = new Date(now.getTime() - minAgeMinutes * 60 * 1000);

  // Find orders that need attention:
  // 1. Pending orders (need payment verification)
  // 2. Payment confirmed but not sent to Hubnet (need Hubnet retry)
  // 3. Failed orders (Hubnet failed, need retry)
  const pendingOrders = await prisma.order.findMany({
    where: {
      OR: [
        // Pending orders that need payment verification
        {
          status: "pending",
          createdAt: {
            gte: minCreatedAt,
            lte: maxCreatedAt,
          },
        },
        // Payment confirmed but Hubnet failed - need retry
        {
          status: "payment_confirmed",
          hubnetOrderId: null,
          createdAt: {
            gte: minCreatedAt,
            lte: maxCreatedAt,
          },
        },
        // Failed orders (Hubnet failed) - need retry
        {
          status: "failed",
          hubnetOrderId: null,
          createdAt: {
            gte: minCreatedAt,
            lte: maxCreatedAt,
          },
        },
      ],
    },
    orderBy: {
      createdAt: "asc", // Process oldest first
    },
    take: limit,
    select: {
      id: true,
      status: true,
      pricePaid: true,
      transactionFee: true,
      customerPhone: true,
      createdAt: true,
      hubnetOrderId: true,
      bundle: {
        select: {
          network: true,
          volume: true,
        },
      },
    },
  });

  return pendingOrders;
};

/**
 * Verify a single order's payment status with Paystack
 * @param {string} orderId - The order ID to verify
 * @returns {Object} Result of verification
 */
export const verifyOrderPayment = async (orderId) => {
  const prisma = getPrisma();

  try {
    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        pricePaid: true,
        transactionFee: true,
        hubnetOrderId: true,
      },
    });

    if (!order) {
      return { success: false, reason: "Order not found" };
    }

    // If already fully processed (processing/completed), skip
    if (order.status === "processing" || order.status === "completed") {
      return {
        success: true,
        reason: "Already processed",
        status: order.status,
      };
    }

    // If payment_confirmed but Hubnet not sent, try to send to Hubnet
    if (order.status === "payment_confirmed") {
      logger.info("Order payment confirmed but not sent to Hubnet, retrying", {
        orderId,
        status: order.status,
      });

      try {
        const hubnetResult = await initiateHubnetOrder(orderId);
        logger.success("Hubnet order initiated on verification retry", {
          orderId,
          status: hubnetResult.status,
          hubnetOrderId: hubnetResult.hubnetOrderId,
        });
        return {
          success: true,
          reason: "Hubnet initiated on retry",
          status: hubnetResult.status,
        };
      } catch (hubnetError) {
        logger.error("Failed to initiate Hubnet order on verification retry", {
          orderId,
          error: hubnetError.message,
        });
        return {
          success: false,
          reason: "Hubnet initiation failed",
          error: hubnetError.message,
        };
      }
    }

    // If failed but payment was made, try to resend to Hubnet
    if (order.status === "failed" && !order.hubnetOrderId) {
      logger.info("Order failed but Hubnet not sent, retrying", {
        orderId,
        status: order.status,
      });

      try {
        const hubnetResult = await initiateHubnetOrder(orderId);
        logger.success("Hubnet order initiated on failed order retry", {
          orderId,
          status: hubnetResult.status,
          hubnetOrderId: hubnetResult.hubnetOrderId,
        });
        return {
          success: true,
          reason: "Hubnet initiated on failed order retry",
          status: hubnetResult.status,
        };
      } catch (hubnetError) {
        logger.error("Failed to initiate Hubnet order on failed order retry", {
          orderId,
          error: hubnetError.message,
        });
        return {
          success: false,
          reason: "Hubnet retry failed",
          error: hubnetError.message,
        };
      }
    }

    // Order should be pending at this point - verify and process
    if (order.status !== "pending") {
      return {
        success: true,
        reason: "Already processed",
        status: order.status,
      };
    }

    // Verify with Paystack (order ID is the payment reference)
    const verification = await verifyTransaction(orderId);

    if (!verification.success) {
      return {
        success: false,
        reason: "Payment not completed",
        paystackStatus: verification.status,
      };
    }

    // Verify amount matches
    const expectedAmount = parseFloat(
      order.pricePaid.add(order.transactionFee || 0).toString(),
    );
    const paidAmount = verification.amount;

    if (Math.abs(paidAmount - expectedAmount) > 0.01) {
      logger.error("Payment amount mismatch during verification", {
        orderId,
        expected: expectedAmount,
        paid: paidAmount,
      });
      return {
        success: false,
        reason: "Amount mismatch",
        expected: expectedAmount,
        paid: paidAmount,
      };
    }

    // Payment verified - confirm the order
    const result = await confirmPayment(orderId, orderId);

    logger.success("Payment verified and confirmed via verification service", {
      orderId,
      amount: paidAmount,
      alreadyProcessed: result.alreadyProcessed,
    });

    // Always attempt Hubnet fulfillment - the function has safeguards against duplicates
    // This handles cases where payment was processed but Hubnet failed
    logger.info("Attempting Hubnet order fulfillment", { orderId });
    try {
      const hubnetResult = await initiateHubnetOrder(orderId);
      if (
        hubnetResult.status === "processing" ||
        hubnetResult.status === "completed"
      ) {
        logger.success("Hubnet order initiated/verified", {
          orderId,
          status: hubnetResult.status,
          hubnetOrderId: hubnetResult.hubnetOrderId,
        });
      }
    } catch (hubnetError) {
      // Log error but don't fail the verification - payment is already confirmed
      logger.error(
        "Failed to initiate Hubnet order (payment confirmed, will retry)",
        {
          orderId,
          error: hubnetError.message,
        },
      );
      // Order remains in payment_confirmed status for manual retry
    }

    return {
      success: true,
      confirmed: true,
      amount: paidAmount,
    };
  } catch (error) {
    // Handle "already processed" errors - but still try Hubnet
    if (
      error.message?.includes("already processed") ||
      error.message?.includes("Order cannot be confirmed")
    ) {
      logger.info("Payment confirmation error, checking if Hubnet needed", {
        orderId,
        error: error.message,
      });

      // Try to send to Hubnet anyway - it has safeguards
      try {
        const currentOrder = await prisma.order.findUnique({
          where: { id: orderId },
          select: { id: true, status: true, hubnetOrderId: true },
        });

        if (
          currentOrder &&
          currentOrder.status === "payment_confirmed" &&
          !currentOrder.hubnetOrderId
        ) {
          logger.info("Attempting Hubnet after confirmation error", {
            orderId,
          });
          const hubnetResult = await initiateHubnetOrder(orderId);
          logger.success("Hubnet order initiated after confirmation error", {
            orderId,
            status: hubnetResult.status,
            hubnetOrderId: hubnetResult.hubnetOrderId,
          });
        }
      } catch (hubnetError) {
        logger.error("Failed to initiate Hubnet after confirmation error", {
          orderId,
          error: hubnetError.message,
        });
      }

      return { success: true, reason: "Already processed" };
    }

    logger.error("Error verifying order payment", {
      orderId,
      error: error.message,
    });

    return {
      success: false,
      reason: "Verification error",
      error: error.message,
    };
  }
};

/**
 * Verify all pending orders and confirm those with successful payments
 * @param {Object} options - Options for verification
 * @returns {Object} Summary of verification results
 */
export const verifyAllPendingPayments = async (options = {}) => {
  const startTime = Date.now();
  const results = {
    checked: 0,
    confirmed: 0,
    alreadyProcessed: 0,
    notPaid: 0,
    errors: 0,
    details: [],
  };

  try {
    const pendingOrders = await getPendingOrdersForVerification(options);
    results.checked = pendingOrders.length;

    logger.info("Starting payment verification", {
      ordersToCheck: pendingOrders.length,
    });

    // Process orders sequentially to avoid rate limiting
    for (const order of pendingOrders) {
      try {
        const result = await verifyOrderPayment(order.id);

        if (result.confirmed) {
          results.confirmed++;
          results.details.push({
            orderId: order.id,
            status: "confirmed",
            amount: result.amount,
          });
        } else if (result.reason === "Already processed") {
          results.alreadyProcessed++;
        } else if (result.reason === "Payment not completed") {
          results.notPaid++;
        } else {
          results.errors++;
          results.details.push({
            orderId: order.id,
            status: "error",
            reason: result.reason,
          });
        }

        // Small delay between API calls to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        results.errors++;
        results.details.push({
          orderId: order.id,
          status: "error",
          reason: error.message,
        });
      }
    }

    const duration = Date.now() - startTime;

    logger.success("Payment verification completed", {
      ...results,
      durationMs: duration,
    });

    return {
      success: true,
      ...results,
      durationMs: duration,
    };
  } catch (error) {
    logger.error("Payment verification batch failed", {
      error: error.message,
    });

    return {
      success: false,
      error: error.message,
      ...results,
    };
  }
};

/**
 * Check if an order's payment has been made (without confirming)
 * Useful for frontend polling
 * @param {string} orderId - The order ID to check
 */
export const checkPaymentStatus = async (orderId) => {
  const prisma = getPrisma();

  try {
    // Get current order status
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        pricePaid: true,
        transactionFee: true,
        createdAt: true,
      },
    });

    if (!order) {
      return { exists: false };
    }

    // If already processed, return current status
    if (order.status !== "pending") {
      return {
        exists: true,
        status: order.status,
        isPaid: order.status !== "pending",
        needsVerification: false,
      };
    }

    // Check with Paystack
    const verification = await verifyTransaction(orderId);

    return {
      exists: true,
      status: order.status,
      isPaid: verification.success,
      paystackStatus: verification.status,
      needsVerification: verification.success, // If paid but still pending, needs verification
    };
  } catch (error) {
    logger.error("Error checking payment status", {
      orderId,
      error: error.message,
    });

    return {
      exists: true,
      status: "pending",
      isPaid: false,
      error: error.message,
    };
  }
};
