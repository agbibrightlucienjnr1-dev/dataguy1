import { getPrisma } from "../config/database.js";
import { verifyTransaction } from "./paystackService.js";
import { verifyMoolreTransaction } from "./moolreService.js";
import { confirmPayment, initiateHubnetOrder as initiateDeliveryOrder } from "./orderService.js";
import { checkOrderStatus as bossuCheckOrderStatus } from "./bossuService.js";
import { incrementCustomerSuccessfulOrders } from "./customerService.js";
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
          providerOrderId: null,
          createdAt: {
            gte: minCreatedAt,
            lte: maxCreatedAt,
          },
        },
        // Failed orders (Hubnet failed) - need retry
        {
          status: "failed",
          providerOrderId: null,
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
      providerOrderId: true,
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
        paymentProvider: true,
        providerOrderId: true,
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

    // Get payment provider (default to paystack for legacy orders)
    const provider = order.paymentProvider || "paystack";
    let verification;

    if (provider === "moolre") {
      verification = await verifyMoolreTransaction(orderId);
    } else {
      // Verify with Paystack (order ID is the payment reference)
      verification = await verifyTransaction(orderId);
    }

    if (!verification.success) {
      return {
        success: false,
        reason: "Payment not completed",
        status: verification.status,
      };
    }

    // Verify amount paid matches expected
    const pricePaidNum = parseFloat(order.pricePaid.toString());
    const transactionFeeNum = order.transactionFee
      ? parseFloat(order.transactionFee.toString())
      : 0;
    const expectedAmount = pricePaidNum + transactionFeeNum;
    const paidAmount = verification.amount;

    const isMoolre = (order.paymentProvider || "paystack") === "moolre";
    
    // For Moolre: if the status API doesn't return an amount (null),
    // skip the amount check — txstatus=1 is sufficient to confirm payment.
    if (paidAmount === null && isMoolre) {
      logger.info("Moolre payment confirmed (no amount in status response — skipping amount check)", {
        orderId,
        expectedAmount,
      });
    } else {
      // Allow 1% tolerance OR 0.50 GHS tolerance (whichever is greater)
      let normalizedPaid = paidAmount ?? 0;
      
      // Guard against Moolre returning amount in pesewas (×100) instead of GHS
      if (isMoolre && normalizedPaid > expectedAmount * 10 && normalizedPaid > 10) {
        logger.warn("Moolre amount looks like pesewas — dividing by 100", {
          orderId, rawPaid: normalizedPaid, expectedAmount
        });
        normalizedPaid = normalizedPaid / 100;
      }

      const tolerancePercent = expectedAmount * 0.01;
      const tolerance = Math.max(tolerancePercent, 0.5);

      logger.info("Amount verification check", {
        orderId,
        expected: expectedAmount,
        paid: normalizedPaid,
        tolerance,
        provider: order.paymentProvider,
      });

      if (Math.abs(normalizedPaid - expectedAmount) > tolerance) {
        logger.error("Payment amount mismatch during verification", {
          orderId,
          expected: expectedAmount,
          paid: normalizedPaid,
          rawPaid: paidAmount,
          tolerance,
        });
        return {
          success: false,
          reason: "Amount mismatch",
          expected: expectedAmount,
          paid: normalizedPaid,
        };
      }
    }

    // Payment verified - confirm the order
    const result = await confirmPayment(orderId, orderId);

    logger.success("Payment verified and confirmed via verification service", {
      orderId,
      amount: paidAmount,
      alreadyProcessed: result.alreadyProcessed,
    });

    // Always attempt delivery fulfillment - the function has safeguards against duplicates
    logger.info("Attempting delivery order fulfillment", { orderId });
    try {
      const deliveryResult = await initiateDeliveryOrder(orderId);
      if (
        deliveryResult.status === "processing" ||
        deliveryResult.status === "completed"
      ) {
        logger.success("Delivery order initiated/verified", {
          orderId,
          status: deliveryResult.status,
          providerOrderId: deliveryResult.providerOrderId,
        });
      }
    } catch (deliveryError) {
      // Log error but don't fail the verification - payment is already confirmed
      logger.error(
        "Failed to initiate delivery order (payment confirmed, will retry)",
        {
          orderId,
          error: deliveryError.message,
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
          select: { id: true, status: true, providerOrderId: true },
        });

        if (
          currentOrder &&
          currentOrder.status === "payment_confirmed" &&
          !currentOrder.providerOrderId
        ) {
          logger.info("Attempting delivery after confirmation error", {
            orderId,
          });
          const deliveryResult = await initiateDeliveryOrder(orderId);
          logger.success("Delivery order initiated after confirmation error", {
            orderId,
            status: deliveryResult.status,
            providerOrderId: deliveryResult.providerOrderId,
          });
        }
      } catch (deliveryError) {
        logger.error("Failed to initiate delivery after confirmation error", {
          orderId,
          error: deliveryError.message,
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

    // Also check Bossu orders stuck in "processing"
    const bossuResults = await verifyProcessingBossuOrders();

    const duration = Date.now() - startTime;

    logger.success("Payment verification completed", {
      ...results,
      bossu: bossuResults,
      durationMs: duration,
    });

    return {
      success: true,
      ...results,
      bossu: bossuResults,
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
        paymentProvider: true,
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

    // Check with Provider
    const provider = order.paymentProvider || "paystack";
    let verification;

    if (provider === "moolre") {
      verification = await verifyMoolreTransaction(orderId);
    } else {
      verification = await verifyTransaction(orderId);
    }

    return {
      exists: true,
      status: order.status,
      isPaid: verification.success,
      providerStatus: verification.status,
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

/**
 * Poll Bossu API for orders stuck in "processing" for over 1 hour.
 * Acts as a fallback for missed/delayed Bossu webhooks.
 */
export const verifyProcessingBossuOrders = async () => {
  const prisma = getPrisma();
  const results = { checked: 0, completed: 0, failed: 0, errors: 0 };

  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const stuckOrders = await prisma.order.findMany({
      where: {
        status: "processing",
        deliveryProvider: "bossu",
        updatedAt: { lte: oneHourAgo },
        providerOrderId: { not: null },
      },
      select: {
        id: true,
        providerOrderId: true,
        customerPhone: true,
        customerName: true,
        bundle: { select: { network: true, volume: true } },
      },
      take: 20,
    });

    results.checked = stuckOrders.length;

    if (stuckOrders.length === 0) {
      return results;
    }

    logger.info("Checking stuck Bossu orders", { count: stuckOrders.length });

    for (const order of stuckOrders) {
      try {
        // Skip lock IDs — these never reached Bossu
        if (order.providerOrderId.startsWith("DELIV-LOCK")) {
          continue;
        }

        const statusResult = await bossuCheckOrderStatus(order.providerOrderId);

        if (!statusResult.success) {
          logger.warn("Bossu status check failed for order", {
            orderId: order.id,
            providerOrderId: order.providerOrderId,
          });
          results.errors++;
          continue;
        }

        const bossuStatus = (statusResult.status || "").toLowerCase();

        if (["completed", "success", "delivered"].includes(bossuStatus)) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: "completed",
              completedAt: new Date(),
              providerResponse: JSON.stringify({
                provider: "bossu",
                resolvedBy: "polling_fallback",
                bossuStatus,
                polledAt: new Date().toISOString(),
              }),
            },
          });

          await incrementCustomerSuccessfulOrders({
            customerPhone: order.customerPhone,
            customerName: order.customerName,
          });

          results.completed++;
          logger.success("Bossu order resolved via polling", {
            orderId: order.id,
            providerOrderId: order.providerOrderId,
            bossuStatus,
          });
        } else if (["failed", "error", "cancelled"].includes(bossuStatus)) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: "failed",
              providerResponse: JSON.stringify({
                provider: "bossu",
                resolvedBy: "polling_fallback",
                bossuStatus,
                polledAt: new Date().toISOString(),
              }),
            },
          });

          results.failed++;
          logger.warn("Bossu order failed (resolved via polling)", {
            orderId: order.id,
            providerOrderId: order.providerOrderId,
            bossuStatus,
          });
        }

        // Rate-limit API calls
        await new Promise((r) => setTimeout(r, 300));
      } catch (err) {
        results.errors++;
        logger.error("Error polling Bossu order status", {
          orderId: order.id,
          error: err.message,
        });
      }
    }

    logger.info("Bossu polling fallback completed", results);
    return results;
  } catch (error) {
    logger.error("Bossu polling fallback batch failed", {
      error: error.message,
    });
    return { ...results, error: error.message };
  }
};
