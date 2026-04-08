import express from "express";
import { getSettings, updateSettings } from "../controllers/settingsController.js";
import { authenticate, authorize } from "../middlewares/auth.js";

const router = express.Router();

// Only admin can view and update system settings
router.use(authenticate);
router.use(authorize("admin"));

router.route("/")
  .get(getSettings)
  .put(updateSettings);

export default router;
