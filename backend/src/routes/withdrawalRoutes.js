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

const router = express.Router();

// Helper endpoints (authenticated users)
router.get("/banks", authenticate, getGhanaBanks);
router.post("/verify-account", authenticate, verifyAccountNumber);

// User withdrawal routes (agents/sub-agents)
router.post("/", authenticate, createWithdrawal);
router.get("/", authenticate, getMyWithdrawals);
router.get("/stats", authenticate, getWithdrawalStats);
router.get("/:id", authenticate, getWithdrawalById);

// Admin routes
router.get("/admin/all", authenticate, requireAdmin, getAllWithdrawalsAdmin);
router.put(
  "/:id/approve",
  authenticate,
  requireAdmin,
  approveWithdrawalRequest,
);
router.put("/:id/reject", authenticate, requireAdmin, rejectWithdrawalRequest);
router.put(
  "/:id/complete",
  authenticate,
  requireAdmin,
  completeWithdrawalManuallyRequest,
);

export default router;
