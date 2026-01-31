import express from "express";
import { register, login, getMe } from "../controllers/authController.js";
import { authenticate } from "../middlewares/auth.js";
import { authRateLimiter, apiRateLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

// Public routes - strict rate limiting for auth endpoints
router.post("/register", authRateLimiter, register);
router.post("/login", authRateLimiter, login);

// Protected routes - moderate rate limiting
router.get("/me", apiRateLimiter, authenticate, getMe);

export default router;
