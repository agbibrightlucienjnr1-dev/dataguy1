import express from "express";
import {
  paystackWebhook,
  paymentCallback,
  verifyPaymentStatus,
} from "../controllers/paymentController.js";

const router = express.Router();

// Webhook endpoint (no authentication - verified by signature)
router.post("/webhook", paystackWebhook);

// Callback endpoint for payment redirect
router.get("/callback", paymentCallback);

// Verify payment status (public)
router.get("/verify/:reference", verifyPaymentStatus);

export default router;
