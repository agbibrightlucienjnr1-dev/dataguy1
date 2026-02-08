import express from "express";
import {
  getMySubAgents,
  updateShopName,
} from "../controllers/agentController.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import { apiRateLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

// All routes require authentication
router.use(apiRateLimiter);
router.use(authenticate);

// Get agent's sub-agents (agents only)
router.get("/sub-agents", authorize("agent"), getMySubAgents);

// Update shop name (agents and sub-agents)
router.patch("/shop-name", authorize("agent", "sub_agent"), updateShopName);

export default router;
