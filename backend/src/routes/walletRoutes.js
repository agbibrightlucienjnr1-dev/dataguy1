import express from "express";
import {
  getMyWallet,
  getMyTransactions,
  getMySummary,
} from "../controllers/walletController.js";
import { authenticate, authorize } from "../middlewares/auth.js";

const router = express.Router();

// Protected routes (agents and sub-agents only)
router.get("/", authenticate, authorize("agent", "sub_agent"), getMyWallet);
router.get(
  "/transactions",
  authenticate,
  authorize("agent", "sub_agent"),
  getMyTransactions,
);
router.get(
  "/summary",
  authenticate,
  authorize("agent", "sub_agent"),
  getMySummary,
);

export default router;
