import express from "express";
import {
  register,
  login,
  getMe,
  updatePassword,
  updatePreferences,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { authenticate } from "../middlewares/auth.js";
import { authRateLimiter, apiRateLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

// Public routes - strict rate limiting for auth endpoints
router.post("/register", authRateLimiter, register);
router.post("/login", authRateLimiter, login);
router.post("/forgot-password", authRateLimiter, forgotPassword);
router.post("/reset-password", authRateLimiter, resetPassword);

// Protected routes - moderate rate limiting
router.get("/me", apiRateLimiter, authenticate, getMe);
router.patch(
  "/change-password",
  apiRateLimiter,
  authenticate,
  updatePassword,
);
router.patch(
  "/preferences",
  apiRateLimiter,
  authenticate,
  updatePreferences,
);

export default router;
