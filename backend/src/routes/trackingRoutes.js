import express from "express";
import { captureEvent } from "../controllers/trackingController.js";

const router = express.Router();

router.post("/", captureEvent);

export default router;
