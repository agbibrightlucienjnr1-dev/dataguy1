import express from "express";
import {
  getEvent,
  register,
  verifyPayment,
  getAdminRegistrations,
  updateEventDetails,
} from "../controllers/eventController.js";
import {
  publicRateLimiter,
  paymentRateLimiter,
} from "../middlewares/rateLimiter.js";
import { authenticate, authorize } from "../middlewares/auth.js";

const router = express.Router();

// Public: Get event details (defaults to ai-video-masterclass if slug omitted)
router.get("/:slug?", publicRateLimiter, getEvent);

// Public: Register for event & initialize Paystack
router.post("/:slug/register", paymentRateLimiter, register);
router.post("/register", paymentRateLimiter, register);

// Public: Verify payment by Paystack reference
router.get("/verify/:reference", publicRateLimiter, verifyPayment);

// Admin: View registrations
router.get(
  "/:slug/admin/registrations",
  authenticate,
  authorize("admin"),
  getAdminRegistrations,
);
router.get(
  "/admin/registrations",
  authenticate,
  authorize("admin"),
  getAdminRegistrations,
);

// Admin: Update event details
router.put(
  "/:slug/admin",
  authenticate,
  authorize("admin"),
  updateEventDetails,
);
router.put("/admin", authenticate, authorize("admin"), updateEventDetails);

export default router;
