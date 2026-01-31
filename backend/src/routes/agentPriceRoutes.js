import express from "express";
import {
  setPrice,
  getMyPrices,
  getPriceForBundle,
  getBundlesWithPricing,
  deletePrice,
  bulkSetPrices,
} from "../controllers/agentPriceController.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import { apiRateLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

// All routes require authentication and agent role
router.use(apiRateLimiter);
router.use(authenticate);
router.use(authorize("agent"));

// Get all bundles with agent's pricing
router.get("/bundles/all", getBundlesWithPricing);

// Bulk set prices
router.post("/bulk", bulkSetPrices);

// Get all agent prices
router.get("/", getMyPrices);

// Specific bundle operations
router.get("/:bundleId", getPriceForBundle);
router.post("/:bundleId", setPrice);
router.patch("/:bundleId", setPrice);
router.delete("/:bundleId", deletePrice);

export default router;
