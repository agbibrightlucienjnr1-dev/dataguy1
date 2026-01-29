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
} from "../controllers/orderController.js";
import { authenticate, authorize } from "../middlewares/auth.js";

const router = express.Router();

// Public routes - Payment Link Flow (no authentication required)
router.get("/link/:code", getSellerInfo);
router.get("/link/:code/bundles", getLinkBundles);
router.post("/link/:code/purchase", purchaseFromLink);

// Public routes - Legacy (no authentication required)
router.post("/purchase", createPurchase);
router.get("/:id", getOrder);
router.get("/customer/:phone", getCustomerOrders);

// Protected routes (sellers only - agents and sub-agents)
router.get(
  "/seller/my-orders",
  authenticate,
  authorize("agent", "sub_agent"),
  getMyOrders,
);
router.get(
  "/seller/stats",
  authenticate,
  authorize("agent", "sub_agent"),
  getMyStats,
);

export default router;
