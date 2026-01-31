import express from "express";
import {
  getMyWallet,
  getMyTransactions,
  getMySummary,
} from "../controllers/walletController.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import { apiRateLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

// Protected routes (agents and sub-agents only)
router.get(
  "/",
  apiRateLimiter,
  authenticate,
  authorize("agent", "sub_agent"),
  getMyWallet,
);
router.get(
  "/transactions",
  apiRateLimiter,
  authenticate,
  authorize("agent", "sub_agent"),
  getMyTransactions,
);
router.get(
  "/summary",
  apiRateLimiter,
  authenticate,
  authorize("agent", "sub_agent"),
  getMySummary,
);

export default router;
