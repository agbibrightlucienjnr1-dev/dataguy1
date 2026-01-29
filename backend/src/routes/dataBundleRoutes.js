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

const router = express.Router();

// Public route - active bundles only
router.get("/active", getActiveBundlesOnly);

// Protected routes - require authentication
router.get("/", authenticate, getAllBundles);
router.get("/:id", authenticate, getBundle);

// Admin only routes
router.post("/", authenticate, isAdmin, createBundle);
router.patch("/:id", authenticate, isAdmin, updateBundle);
router.delete("/:id", authenticate, isAdmin, deleteBundle);
router.patch("/:id/toggle", authenticate, isAdmin, toggleBundle);

export default router;
