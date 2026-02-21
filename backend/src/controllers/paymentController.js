import { asyncHandler } from "../middlewares/errorHandler.js";
import {
  confirmPayment,
  getOrderById,
  initiateHubnetOrder,
} from "../services/orderService.js";
import {
  verifyTransaction,
  verifyWebhookSignature,
  parseWebhookEvent,
} from "../services/paystackService.js";
import { processTransferWebhook } from "../services/withdrawalService.js";
import {
  verifyOrderPayment,
  checkPaymentStatus,
} from "../services/paymentVerificationService.js";
import { AppError } from "../middlewares/errorHandler.js";
import { logger } from "../utils/logger.js";

/**
 * Paystack webhook endpoint
 * POST /api/payments/webhook
 */
export const paystackWebhook = asyncHandler(async (req, res) => {
  // Verify webhook signature
  const signature = req.headers["x-paystack-signature"];

  if (!signature) {
    throw new AppError("Missing webhook signature", 401);
  }

  const isValid = verifyWebhookSignature(req.body, signature);

  if (!isValid) {
    logger.error("Invalid Paystack webhook signature");
    throw new AppError("Invalid webhook signature", 401);
  }

  // Parse webhook event
  const event = parseWebhookEvent(req.body);

  logger.info("Paystack webhook received", {
    event: event.event,
    reference: event.reference,
  });

  // Handle charge.success event
  if (event.event === "charge.success") {
    const orderId = event.reference; // We use orderId as reference
    const paymentReference = event.reference;

    try {
      // Get order first to check if it exists and its status
      const order = await getOrderById(orderId);

      // If order is already processed, just acknowledge the webhook
      if (order.status !== "pending") {
        logger.info("Order already processed via webhook", {
          orderId,
          status: order.status,
        });
        return res.status(200).json({
          success: true,
          message: "Order already processed",
        });
      }

      // Verify the transaction with Paystack
      const verification = await verifyTransaction(paymentReference);

      if (!verification.success) {
        logger.error("Payment verification failed", {
          reference: paymentReference,
        });
        return res.status(200).json({ received: true });
      }

      // Verify amount matches (should be pricePaid + transactionFee)
      const expectedAmount = parseFloat(
        order.pricePaid.add(order.transactionFee || 0).toString(),
      );
      const paidAmount = verification.amount;

      if (Math.abs(paidAmount - expectedAmount) > 0.01) {
        // Allow small floating point differences (0.01 GHS)
        logger.error("Amount mismatch", {
          expected: expectedAmount,
          paid: paidAmount,
          orderId,
        });
        throw new AppError("Payment amount mismatch", 400);
      }

      // Process payment confirmation and credit wallet
      const result = await confirmPayment(orderId, paymentReference);

      // Check if payment was already processed (duplicate webhook)
      if (result.alreadyProcessed) {
        logger.info("Payment already processed, webhook acknowledged", {
          orderId,
        });
        return res.status(200).json({
          success: true,
          message: "Order already processed",
        });
      }

      // Automatically initiate Hubnet order fulfillment
      logger.info("Automatically initiating Hubnet order fulfillment", {
        orderId,
      });
      try {
        await initiateHubnetOrder(orderId);
        logger.success("Hubnet order initiated automatically after payment", {
          orderId,
        });
      } catch (hubnetError) {
        // Log error but don't fail the webhook - payment is already confirmed
        logger.error(
          "Failed to auto-initiate Hubnet order (payment confirmed, will retry)",
          {
            orderId,
            error: hubnetError.message,
            stack: hubnetError.stack,
          },
        );
        // Order remains in payment_confirmed status for manual retry
      }

      logger.success("Payment processed successfully via webhook", { orderId });

      return res.status(200).json({
        success: true,
        message: "Payment processed successfully",
      });
    } catch (error) {
      // If order not found, log but don't fail (might be a test transaction)
      if (error.statusCode === 404) {
        logger.warn("Order not found in webhook", { orderId });
        return res.status(200).json({ received: true });
      }
      // If already processed, that's fine
      if (
        error.message?.includes("already processed") ||
        error.message?.includes("Order cannot be confirmed")
      ) {
        logger.info("Order already processed (webhook)", { orderId });
        return res.status(200).json({
          success: true,
          message: "Order already processed",
        });
      }
      // Re-throw other errors
      throw error;
    }
  }

  // Handle transfer events (withdrawal)
  if (
    event.event === "transfer.success" ||
    event.event === "transfer.failed" ||
    event.event === "transfer.reversed"
  ) {
    await processTransferWebhook(event);

    return res.status(200).json({
      success: true,
      message: "Transfer webhook processed",
    });
  }

  // Acknowledge other events
  res.status(200).json({ received: true });
});

/**
 * Payment callback endpoint (for redirect)
 * GET /api/payments/callback
 */
export const paymentCallback = asyncHandler(async (req, res) => {
  const { reference, trxref } = req.query;
  const paymentReference = reference || trxref;

  if (!paymentReference) {
    throw new AppError("Payment reference is required", 400);
  }

  try {
    // Verify the transaction
    const verification = await verifyTransaction(paymentReference);

    const orderId = paymentReference; // We use orderId as reference

    if (verification.success) {
      // Redirect to success page
      const successUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/payment/success?orderId=${orderId}`;
      return res.redirect(successUrl);
    } else {
      // Redirect to failure page
      const failureUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/payment/failed?orderId=${orderId}`;
      return res.redirect(failureUrl);
    }
  } catch (error) {
    logger.error("Payment callback error", error);
    const errorUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/payment/error`;
    return res.redirect(errorUrl);
  }
});

/**
 * Verify payment status
 * GET /api/payments/verify/:reference
 */
export const verifyPaymentStatus = asyncHandler(async (req, res) => {
  const { reference } = req.params;

  const verification = await verifyTransaction(reference);

  res.status(200).json({
    success: true,
    data: verification,
  });
});

/**
 * Verify and process payment (for callback redirect)
 * This endpoint verifies the payment and triggers order processing
 * POST /api/payments/verify-and-process/:reference
 */
export const verifyAndProcessPayment = asyncHandler(async (req, res) => {
  const { reference } = req.params;
  const orderId = reference; // We use orderId as reference

  try {
    // Get order first
    const order = await getOrderById(orderId);

    // Check if already processed - if so, just return the current order state
    if (order.status !== "pending") {
      logger.info("Order already processed (callback)", {
        orderId,
        status: order.status,
      });
      return res.status(200).json({
        success: true,
        message: "Order already processed",
        data: { order },
      });
    }

    // Verify the transaction with Paystack
    const verification = await verifyTransaction(reference);

    if (!verification.success) {
      logger.error("Payment verification failed", { reference });
      throw new AppError("Payment verification failed", 400);
    }

    // Verify amount matches (should be pricePaid + transactionFee)
    const expectedAmount = parseFloat(
      order.pricePaid.add(order.transactionFee || 0).toString(),
    );
    const paidAmount = verification.amount;

    if (Math.abs(paidAmount - expectedAmount) > 0.01) {
      // Allow small floating point differences (0.01 GHS)
      logger.error("Amount mismatch", {
        expected: expectedAmount,
        paid: paidAmount,
        orderId,
      });
      throw new AppError("Payment amount mismatch", 400);
    }

    // Process payment confirmation and credit wallet
    // This function has built-in duplicate prevention
    const result = await confirmPayment(orderId, reference);

    // Note: Hubnet order is now triggered manually by admin via admin panel

    logger.success("Payment verified and processed (callback)", { orderId });

    res.status(200).json({
      success: true,
      message: "Payment verified and order processing initiated",
      data: { order: result.order },
    });
  } catch (error) {
    // If already processed by webhook, that's fine - return success
    if (
      error.message?.includes("already processed") ||
      error.message?.includes("Order cannot be confirmed") ||
      error.statusCode === 400
    ) {
      // Try to get the current order state
      try {
        const currentOrder = await getOrderById(orderId);
        logger.info("Order already processed, returning current state", {
          orderId,
        });
        return res.status(200).json({
          success: true,
          message: "Order already processed",
          data: { order: currentOrder },
        });
      } catch (getOrderError) {
        // If we can't get the order, just return the error
        throw error;
      }
    }
    // Re-throw other errors
    throw error;
  }
});

/**
 * Check payment status for polling
 * This endpoint allows the frontend to poll for payment status updates
 * GET /api/payments/check-status/:reference
 */
export const checkPaymentStatusEndpoint = asyncHandler(async (req, res) => {
  const { reference } = req.params;

  const result = await checkPaymentStatus(reference);

  if (!result.exists) {
    throw new AppError("Order not found", 404);
  }

  // If payment is made but order is still pending, trigger verification
  if (result.needsVerification) {
    logger.info("Payment detected, triggering verification", { reference });
    const verifyResult = await verifyOrderPayment(reference);

    if (verifyResult.confirmed) {
      return res.status(200).json({
        success: true,
        data: {
          status: "payment_confirmed",
          isPaid: true,
          justConfirmed: true,
          message: "Payment confirmed successfully",
        },
      });
    }
  }

  res.status(200).json({
    success: true,
    data: {
      status: result.status,
      isPaid: result.isPaid,
      paystackStatus: result.paystackStatus,
    },
  });
});

/**
 * Force verify and process a specific order
 * POST /api/payments/force-verify/:reference
 */
export const forceVerifyPayment = asyncHandler(async (req, res) => {
  const { reference } = req.params;

  logger.info("Force verification requested", { reference });

  const result = await verifyOrderPayment(reference);

  if (result.success && result.confirmed) {
    return res.status(200).json({
      success: true,
      message: "Payment verified and confirmed",
      data: {
        orderId: reference,
        amount: result.amount,
      },
    });
  }

  if (result.success && result.reason === "Already processed") {
    return res.status(200).json({
      success: true,
      message: "Order already processed",
      data: {
        orderId: reference,
        status: result.status,
      },
    });
  }

  throw new AppError(result.reason || "Payment verification failed", 400);
});
