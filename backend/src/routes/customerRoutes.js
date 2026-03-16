import express from "express";
import { authenticate, authorize } from "../middlewares/auth.js";
import {
  listCustomers,
  exportCustomersCsv,
} from "../controllers/customerController.js";

const router = express.Router();

// Get customers (admin/all vs agent/sub-agent own customers)
router.get(
  "/",
  authenticate,
  authorize("admin", "agent", "sub_agent"),
  listCustomers,
);

// Export customers to CSV (Excel friendly)
router.get(
  "/export",
  authenticate,
  authorize("admin", "agent", "sub_agent"),
  exportCustomersCsv,
);

export default router;
