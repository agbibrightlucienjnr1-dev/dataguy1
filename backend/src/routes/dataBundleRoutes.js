import express from "express";
import {
  createBundle,
  getAllBundles,
  getActiveBundlesOnly,
  getBundle,
  updateBundle,
  deleteBundle,
  toggleBundle,
} from "../controllers/dataBundleController.js";
import { authenticate, isAdmin } from "../middlewares/auth.js";
import {
  publicRateLimiter,
  apiRateLimiter,
  adminRateLimiter,
} from "../middlewares/rateLimiter.js";

const router = express.Router();

// Public route - active bundles only
router.get("/active", publicRateLimiter, getActiveBundlesOnly);

// Protected routes - require authentication
router.get("/", apiRateLimiter, authenticate, getAllBundles);
router.get("/:id", apiRateLimiter, authenticate, getBundle);

// Admin only routes
router.post("/", adminRateLimiter, authenticate, isAdmin, createBundle);
router.patch("/:id", adminRateLimiter, authenticate, isAdmin, updateBundle);
router.delete("/:id", adminRateLimiter, authenticate, isAdmin, deleteBundle);
router.patch(
  "/:id/toggle",
  adminRateLimiter,
  authenticate,
  isAdmin,
  toggleBundle,
);

export default router;
