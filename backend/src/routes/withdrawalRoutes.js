import express from "express";
import {
  createWithdrawal,
  getMyWithdrawals,
  getWithdrawalById,
  getAllWithdrawalsAdmin,
  approveWithdrawalRequest,
  rejectWithdrawalRequest,
  completeWithdrawalManuallyRequest,
  getWithdrawalStats,
  getGhanaBanks,
  verifyAccountNumber,
} from "../controllers/withdrawalController.js";
import { authenticate } from "../middlewares/auth.js";
import { requireAdmin } from "../utils/authorization.js";
import {
  withdrawalRateLimiter,
  apiRateLimiter,
  adminRateLimiter,
} from "../middlewares/rateLimiter.js";

const router = express.Router();

// Helper endpoints (authenticated users)
router.get("/banks", apiRateLimiter, authenticate, getGhanaBanks);
router.post("/verify-account", apiRateLimiter, authenticate, verifyAccountNumber);

// User withdrawal routes (agents/sub-agents)
router.post("/", withdrawalRateLimiter, authenticate, createWithdrawal);
router.get("/", apiRateLimiter, authenticate, getMyWithdrawals);
router.get("/stats", apiRateLimiter, authenticate, getWithdrawalStats);
router.get("/:id", apiRateLimiter, authenticate, getWithdrawalById);

// Admin routes
router.get(
  "/admin/all",
  adminRateLimiter,
  authenticate,
  requireAdmin,
  getAllWithdrawalsAdmin,
);
router.put(
  "/:id/approve",
  adminRateLimiter,
  authenticate,
  requireAdmin,
  approveWithdrawalRequest,
);
router.put(
  "/:id/reject",
  adminRateLimiter,
  authenticate,
  requireAdmin,
  rejectWithdrawalRequest,
);
router.put(
  "/:id/complete",
  adminRateLimiter,
  authenticate,
  requireAdmin,
  completeWithdrawalManuallyRequest,
);

export default router;
