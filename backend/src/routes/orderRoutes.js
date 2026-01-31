import express from "express";
import {
  createPurchase,
  getOrder,
  getCustomerOrders,
  getMyOrders,
  getMyStats,
  getSellerInfo,
  getLinkBundles,
  purchaseFromLink,
  trackOrder,
  trackOrdersByPhoneNumber,
} from "../controllers/orderController.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import {
  publicRateLimiter,
  orderCreationRateLimiter,
  apiRateLimiter,
} from "../middlewares/rateLimiter.js";

const router = express.Router();

// Public routes - Order Tracking (no authentication required)
router.get("/track/:orderId", publicRateLimiter, trackOrder);
router.get("/track/phone/:phone", publicRateLimiter, trackOrdersByPhoneNumber);

// Public routes - Payment Link Flow (no authentication required)
router.get("/link/:code", publicRateLimiter, getSellerInfo);
router.get("/link/:code/bundles", publicRateLimiter, getLinkBundles);
router.post("/link/:code/purchase", orderCreationRateLimiter, purchaseFromLink);

// Public routes - Legacy (no authentication required)
router.post("/purchase", orderCreationRateLimiter, createPurchase);
router.get("/:id", publicRateLimiter, getOrder);
router.get("/customer/:phone", publicRateLimiter, getCustomerOrders);

// Protected routes (sellers only - agents and sub-agents)
router.get(
  "/seller/my-orders",
  apiRateLimiter,
  authenticate,
  authorize("agent", "sub_agent"),
  getMyOrders,
);
router.get(
  "/seller/stats",
  apiRateLimiter,
  authenticate,
  authorize("agent", "sub_agent"),
  getMyStats,
);

export default router;
