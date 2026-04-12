import express from "express";
import { bossuWebhook } from "../controllers/bossuWebhookController.js";
import { paymentRateLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

/**
 * POST /api/bossu/webhook
 * Receives delivery status updates from Bossu Data Hub
 */
router.post("/webhook", paymentRateLimiter, bossuWebhook);

export default router;
