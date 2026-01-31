import express from "express";
import {
  hubnetWebhook,
  checkDeliveryStatus,
} from "../controllers/hubnetController.js";
import { paymentRateLimiter, apiRateLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

/**
 * POST /api/hubnet/webhook
 * Receives delivery status updates from Hubnet
 * This is the ONLY source of truth for delivery status
 */
router.post("/webhook", paymentRateLimiter, hubnetWebhook);

/**
 * GET /api/hubnet/status/:orderId
 * Check delivery status (for debugging/manual verification)
 */
router.get("/status/:orderId", apiRateLimiter, checkDeliveryStatus);

export default router;
