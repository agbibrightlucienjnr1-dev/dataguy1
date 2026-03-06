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

    logger.info("=== PAYMENT WEBHOOK START ===", { orderId, paymentReference });

    try {
      // Get order first to check if it exists and its status
      const order = await getOrderById(orderId);
      logger.info("Order found", {
        orderId,
        status: order.status,
        hubnetOrderId: order.hubnetOrderId,
      });

      // If order is already fully processed (processing/completed), just acknowledge
      if (order.status === "processing" || order.status === "completed") {
        logger.info("Order already sent to Hubnet - SKIPPING", {
          orderId,
          status: order.status,
          hubnetOrderId: order.hubnetOrderId,
        });
        return res.status(200).json({
          success: true,
          message: "Order already processed",
        });
      }

      // If order is payment_confirmed but not sent to Hubnet, we need to retry Hubnet
      if (order.status === "payment_confirmed") {
        logger.info(
          "Order payment confirmed but not sent to Hubnet, retrying",
          {
            orderId,
            status: order.status,
          },
        );

        // Try to send to Hubnet
        try {
          const hubnetResult = await initiateHubnetOrder(orderId);
          logger.success("Hubnet order initiated on retry", {
            orderId,
            status: hubnetResult.status,
            hubnetOrderId: hubnetResult.hubnetOrderId,
          });
        } catch (hubnetError) {
          logger.error("Failed to initiate Hubnet order on retry", {
            orderId,
            error: hubnetError.message,
          });
        }

        return res.status(200).json({
          success: true,
          message: "Order processed",
        });
      }

      // If order failed (Hubnet failed previously), retry Hubnet
      if (order.status === "failed" && !order.hubnetOrderId) {
        logger.info("Order failed previously, retrying Hubnet", {
          orderId,
          status: order.status,
        });

        // Try to send to Hubnet
        try {
          const hubnetResult = await initiateHubnetOrder(orderId);
          logger.success("Hubnet order initiated on failed order retry", {
            orderId,
            status: hubnetResult.status,
            hubnetOrderId: hubnetResult.hubnetOrderId,
          });
        } catch (hubnetError) {
          logger.error("Failed to initiate Hubnet order on failed retry", {
            orderId,
            error: hubnetError.message,
          });
        }

        return res.status(200).json({
          success: true,
          message: "Order retry processed",
        });
      }

      // Order should be pending at this point
      if (order.status !== "pending") {
        logger.warn("Unexpected order status in webhook", {
          orderId,
          status: order.status,
        });
        return res.status(200).json({ received: true });
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
      const pricePaidNum = parseFloat(order.pricePaid.toString());
      const transactionFeeNum = order.transactionFee
        ? parseFloat(order.transactionFee.toString())
        : 0;
      const expectedAmount = pricePaidNum + transactionFeeNum;
      const paidAmount = verification.amount;

      // Allow 1% tolerance OR 0.50 GHS tolerance (whichever is greater) for rounding differences
      const tolerancePercent = expectedAmount * 0.01;
      const tolerance = Math.max(tolerancePercent, 0.5);

      if (Math.abs(paidAmount - expectedAmount) > tolerance) {
        logger.error("Amount mismatch", {
          expected: expectedAmount,
          paid: paidAmount,
          tolerance,
          orderId,
        });
        throw new AppError("Payment amount mismatch", 400);
      }

      logger.info("Amount verification passed", {
        orderId,
        expected: expectedAmount,
        paid: paidAmount,
        diff: Math.abs(paidAmount - expectedAmount),
      });

      // Process payment confirmation and credit wallet
      logger.info("Calling confirmPayment", { orderId });
      const result = await confirmPayment(orderId, paymentReference);
      logger.info("confirmPayment completed", {
        orderId,
        alreadyProcessed: result.alreadyProcessed,
      });

      if (result.alreadyProcessed) {
        logger.info("Payment already processed", { orderId });
      } else {
        logger.success("Payment confirmed, commission credited", { orderId });
      }

      // Always attempt Hubnet fulfillment - the function has safeguards against duplicates
      // This handles cases where payment was processed but Hubnet failed
      logger.info("=== CALLING HUBNET ===", { orderId });
      try {
        const hubnetResult = await initiateHubnetOrder(orderId);
        logger.success("=== HUBNET SUCCESS ===", {
          orderId,
          status: hubnetResult.status,
          hubnetOrderId: hubnetResult.hubnetOrderId,
        });
      } catch (hubnetError) {
        // Log error but don't fail the webhook - payment is already confirmed
        logger.error("=== HUBNET FAILED ===", {
          orderId,
          error: hubnetError.message,
          stack: hubnetError.stack,
        });
        // Order remains in payment_confirmed status for manual retry
      }

      logger.success("=== PAYMENT WEBHOOK COMPLETE ===", { orderId });

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

      // If already processed or cannot be confirmed, still try Hubnet
      // The order might be in payment_confirmed status waiting for Hubnet
      if (
        error.message?.includes("already processed") ||
        error.message?.includes("Order cannot be confirmed")
      ) {
        logger.info(
          "Payment confirmation returned error, checking if Hubnet needed",
          {
            orderId,
            error: error.message,
          },
        );

        // Try to send to Hubnet anyway - it has safeguards
        try {
          const currentOrder = await getOrderById(orderId);
          logger.info("Order status after confirmation error", {
            orderId,
            status: currentOrder.status,
            hubnetOrderId: currentOrder.hubnetOrderId,
          });

          // If payment is confirmed but not sent to Hubnet, send it now
          if (
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
    const pricePaidNum = parseFloat(order.pricePaid.toString());
    const transactionFeeNum = order.transactionFee
      ? parseFloat(order.transactionFee.toString())
      : 0;
    const expectedAmount = pricePaidNum + transactionFeeNum;
    const paidAmount = verification.amount;

    // Allow 1% tolerance OR 0.50 GHS tolerance (whichever is greater) for rounding differences
    const tolerancePercent = expectedAmount * 0.01;
    const tolerance = Math.max(tolerancePercent, 0.5);

    if (Math.abs(paidAmount - expectedAmount) > tolerance) {
      logger.error("Amount mismatch", {
        expected: expectedAmount,
        paid: paidAmount,
        tolerance,
        orderId,
      });
      throw new AppError("Payment amount mismatch", 400);
    }

    logger.info("Amount verification passed (callback)", {
      orderId,
      expected: expectedAmount,
      paid: paidAmount,
    });

    // Process payment confirmation and credit wallet
    // This function has built-in duplicate prevention
    const result = await confirmPayment(orderId, reference);

    logger.success("Payment verified and processed (callback)", { orderId });

    // Automatically send to Hubnet after payment confirmation
    logger.info("=== CALLBACK: CALLING HUBNET ===", { orderId });
    try {
      const hubnetResult = await initiateHubnetOrder(orderId);
      logger.success("=== CALLBACK: HUBNET SUCCESS ===", {
        orderId,
        status: hubnetResult.status,
        hubnetOrderId: hubnetResult.hubnetOrderId,
      });
    } catch (hubnetError) {
      // Log error but don't fail - payment is already confirmed
      logger.error("=== CALLBACK: HUBNET FAILED ===", {
        orderId,
        error: hubnetError.message,
        stack: hubnetError.stack,
      });
      // Order remains in payment_confirmed status for retry
    }

    res.status(200).json({
      success: true,
      message: "Payment verified and order processing initiated",
      data: { order: result.order },
    });
  } catch (error) {
    // If already processed by webhook, that's fine - but still try Hubnet
    if (
      error.message?.includes("already processed") ||
      error.message?.includes("Order cannot be confirmed") ||
      error.statusCode === 400
    ) {
      // Try to get the current order state and possibly send to Hubnet
      try {
        const currentOrder = await getOrderById(orderId);
        logger.info("Order already processed, checking if Hubnet needed", {
          orderId,
          status: currentOrder.status,
          hubnetOrderId: currentOrder.hubnetOrderId,
        });

        // If payment is confirmed but not sent to Hubnet, send it now
        if (
          currentOrder.status === "payment_confirmed" &&
          !currentOrder.hubnetOrderId
        ) {
          logger.info("=== CALLBACK ERROR HANDLER: CALLING HUBNET ===", {
            orderId,
          });
          try {
            const hubnetResult = await initiateHubnetOrder(orderId);
            logger.success("=== CALLBACK ERROR HANDLER: HUBNET SUCCESS ===", {
              orderId,
              status: hubnetResult.status,
              hubnetOrderId: hubnetResult.hubnetOrderId,
            });
          } catch (hubnetError) {
            logger.error("=== CALLBACK ERROR HANDLER: HUBNET FAILED ===", {
              orderId,
              error: hubnetError.message,
            });
          }
        }

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
