import express from "express";
import { saveSubscription, broadcastPush } from "../services/pushNotificationService.js";
import { authenticate } from "../middlewares/auth.js";
import { requireAdmin } from "../utils/authorization.js";
import { asyncHandler, AppError } from "../middlewares/errorHandler.js";
import { logger } from "../utils/logger.js";
import { getPrisma } from "../config/database.js";

const router = express.Router();

/**
 * Register or update push notification subscription
 * POST /api/notifications/subscribe
 */
router.post(
  "/subscribe",
  // Optional authentication: we check if token is present manually or let it be public 
  // so visitors (customers) can subscribe too.
  asyncHandler(async (req, res) => {
    const { subscription, phone, role } = req.body;

    if (!subscription) {
      throw new AppError("Subscription object is required", 400);
    }

    // Try to resolve user from auth token if present
    let userId = null;
    let finalRole = role || "customer";

    // Check if auth header is present
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const jwt = await import("jsonwebtoken");
        const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
        
        if (decoded && decoded.id) {
          userId = decoded.id;
          
          // Query user role
          const prisma = getPrisma();
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true }
          });
          if (user) {
            finalRole = user.role;
          }
        }
      } catch (err) {
        logger.debug("Failed to verify token in subscribe endpoint, treating as anonymous", err);
      }
    }

    const saved = await saveSubscription(subscription, userId, phone, finalRole);

    res.status(200).json({
      success: true,
      message: "Subscription registered successfully",
      data: saved,
    });
  })
);

/**
 * Broadcast web push notification to a target group
 * POST /api/notifications/push
 * Protected: Admin only
 */
router.post(
  "/push",
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { target, title, body, url, icon, orderStatus } = req.body;

    if (!title || !body) {
      throw new AppError("Title and body are required for push notification", 400);
    }

    const payload = {
      title,
      body,
      url: url || "/dashboard",
      icon: icon || "/logo192.png",
    };

    const result = await broadcastPush(target, payload, orderStatus);

    res.status(200).json({
      success: true,
      message: `Push notification broadcast initiated for target: ${target}`,
      data: result,
    });
  })
);

export default router;
