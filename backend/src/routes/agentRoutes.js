import express from "express";
import { getMySubAgents } from "../controllers/agentController.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import { apiRateLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

// All routes require authentication and agent role
router.use(apiRateLimiter);
router.use(authenticate);
router.use(authorize("agent"));

// Get agent's sub-agents
router.get("/sub-agents", getMySubAgents);

export default router;
