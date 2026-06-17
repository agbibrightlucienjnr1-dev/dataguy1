import express from "express";
import {
  paystackWebhook,
  paymentCallback,
  verifyPaymentStatus,
  verifyAndProcessPayment,
  checkPaymentStatusEndpoint,
  forceVerifyPayment,
  moolreWebhook,
  moolreVerifyOtp,
  moolreValidateName,
} from "../controllers/paymentController.js";
import {
  paymentRateLimiter,
  publicRateLimiter,
} from "../middlewares/rateLimiter.js";

const router = express.Router();

// Webhook endpoint (no authentication - verified by signature)
// Higher limit for webhooks as they come from Paystack
router.post("/webhook", paymentRateLimiter, paystackWebhook);

// Moolre Webhook
router.post("/moolre/webhook", paymentRateLimiter, moolreWebhook);

// Moolre OTP Verification
router.post("/moolre/verify-otp", publicRateLimiter, moolreVerifyOtp);

// Validate recipient name using Moolre (Public)
router.post("/moolre/validate-name", publicRateLimiter, moolreValidateName);

// Callback endpoint for payment redirect
router.get("/callback", publicRateLimiter, paymentCallback);

// Verify payment status (public)
router.get("/verify/:reference", publicRateLimiter, verifyPaymentStatus);

// Check payment status for polling (public, higher rate limit for polling)
router.get(
  "/check-status/:reference",
  publicRateLimiter,
  checkPaymentStatusEndpoint,
);

// Verify and process payment (called after redirect)
router.post(
  "/verify-and-process/:reference",
  paymentRateLimiter,
  verifyAndProcessPayment,
);

// Force verify payment (for manual retry)
router.post("/force-verify/:reference", paymentRateLimiter, forceVerifyPayment);

export default router;
