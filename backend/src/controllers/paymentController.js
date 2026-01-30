import { asyncHandler } from "../middlewares/errorHandler.js";
import { confirmPayment, getOrderById } from "../services/orderService.js";
import {
  verifyTransaction,
  verifyWebhookSignature,
  parseWebhookEvent,
} from "../services/paystackService.js";
import { processTransferWebhook } from "../services/withdrawalService.js";
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

    // Verify the transaction with Paystack
    const verification = await verifyTransaction(paymentReference);

    if (!verification.success) {
      logger.error("Payment verification failed", {
        reference: paymentReference,
      });
      return res.status(200).json({ received: true });
    }

    // Get order to verify amount
    const order = await getOrderById(orderId);

    // Verify amount matches
    const expectedAmount = parseFloat(order.pricePaid);
    const paidAmount = verification.amount;

    if (paidAmount !== expectedAmount) {
      logger.error("Amount mismatch", {
        expected: expectedAmount,
        paid: paidAmount,
        orderId,
      });
      throw new AppError("Payment amount mismatch", 400);
    }

    // Process payment confirmation and credit wallet
    const result = await confirmPayment(orderId, paymentReference);

    // Note: Hubnet order is now triggered manually by admin via admin panel

    logger.success("Payment processed successfully", { orderId });

    return res.status(200).json({
      success: true,
      message: "Payment processed successfully",
    });
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

  // Get order first
  const order = await getOrderById(orderId);

  // Check if already processed
  if (order.status !== "pending") {
    logger.info("Order already processed", { orderId, status: order.status });
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

  // Verify amount matches
  const expectedAmount = parseFloat(order.pricePaid);
  const paidAmount = verification.amount;

  if (paidAmount !== expectedAmount) {
    logger.error("Amount mismatch", {
      expected: expectedAmount,
      paid: paidAmount,
      orderId,
    });
    throw new AppError("Payment amount mismatch", 400);
  }

  // Process payment confirmation and credit wallet
  const result = await confirmPayment(orderId, reference);

  // Note: Hubnet order is now triggered manually by admin via admin panel

  logger.success("Payment verified and processed", { orderId });

  res.status(200).json({
    success: true,
    message: "Payment verified and order processing initiated",
    data: { order: result.order },
  });
});
