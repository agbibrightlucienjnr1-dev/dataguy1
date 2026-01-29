import express from "express";
import { paymentWebhook } from "../controllers/paymentController.js";

const router = express.Router();

// Webhook endpoint (no authentication - verified by signature)
router.post("/webhook", paymentWebhook);

export default router;
