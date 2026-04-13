import express from "express";
import { ussdCallback } from "../controllers/ussdController.js";
import { publicRateLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

/**
 * POST /api/ussd/callback
 * Receives USSD session callbacks from Moolre
 */
router.post("/callback", publicRateLimiter, ussdCallback);

export default router;
