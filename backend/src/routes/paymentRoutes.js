import express from "express";
import {
  paystackWebhook,
  paymentCallback,
  verifyPaymentStatus,
  verifyAndProcessPayment,
} from "../controllers/paymentController.js";

const router = express.Router();

// Webhook endpoint (no authentication - verified by signature)
router.post("/webhook", paystackWebhook);

// Callback endpoint for payment redirect
router.get("/callback", paymentCallback);

// Verify payment status (public)
router.get("/verify/:reference", verifyPaymentStatus);

// Verify and process payment (called after redirect)
router.post("/verify-and-process/:reference", verifyAndProcessPayment);

export default router;
