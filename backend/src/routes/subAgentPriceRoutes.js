import express from "express";
import {
  setPrice,
  getMyPrices,
  getPriceForBundle,
  getBundlesWithPricing,
  deletePrice,
  bulkSetPrices,
} from "../controllers/subAgentPriceController.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import { apiRateLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

// All routes require authentication and sub-agent role
router.use(apiRateLimiter);
router.use(authenticate);
router.use(authorize("sub_agent"));

// Get all bundles with sub-agent's pricing
router.get("/bundles/all", getBundlesWithPricing);

// Bulk set prices
router.post("/bulk", bulkSetPrices);

// Get all sub-agent prices
router.get("/", getMyPrices);

// Specific bundle operations
router.get("/:bundleId", getPriceForBundle);
router.post("/:bundleId", setPrice);
router.patch("/:bundleId", setPrice);
router.delete("/:bundleId", deletePrice);

export default router;
