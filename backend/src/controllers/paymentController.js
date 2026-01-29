import { asyncHandler } from "../middlewares/errorHandler.js";
import {
  confirmPayment,
  initiateHubnetOrder,
} from "../services/orderService.js";
import { AppError } from "../middlewares/errorHandler.js";

/**
 * Webhook endpoint for payment confirmation
 * POST /api/payments/webhook
 */
export const paymentWebhook = asyncHandler(async (req, res) => {
  const { orderId, paymentReference, status } = req.body;

  // Validate webhook data
  if (!orderId || !paymentReference) {
    throw new AppError("Order ID and payment reference are required", 400);
  }

  if (status !== "success") {
    throw new AppError("Payment not successful", 400);
  }

  // TODO: Verify webhook signature/authenticity
  // This depends on your payment gateway

  // Process payment confirmation and credit wallet
  const result = await confirmPayment(orderId, paymentReference);

  // Initiate Hubnet order
  await initiateHubnetOrder(orderId);

  res.status(200).json({
    success: true,
    message: "Payment confirmed and commission credited",
    data: result,
  });
});
