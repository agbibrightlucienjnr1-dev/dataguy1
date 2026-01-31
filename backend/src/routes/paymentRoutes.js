import express from "express";
import {
  paystackWebhook,
  paymentCallback,
  verifyPaymentStatus,
  verifyAndProcessPayment,
} from "../controllers/paymentController.js";
import {
  paymentRateLimiter,
  publicRateLimiter,
} from "../middlewares/rateLimiter.js";

const router = express.Router();

// Webhook endpoint (no authentication - verified by signature)
// Higher limit for webhooks as they come from Paystack
router.post("/webhook", paymentRateLimiter, paystackWebhook);

// Callback endpoint for payment redirect
router.get("/callback", publicRateLimiter, paymentCallback);

// Verify payment status (public)
router.get("/verify/:reference", publicRateLimiter, verifyPaymentStatus);

// Verify and process payment (called after redirect)
router.post(
  "/verify-and-process/:reference",
  paymentRateLimiter,
  verifyAndProcessPayment,
);

export default router;
