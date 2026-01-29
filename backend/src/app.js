import express from "express";
import cors from "cors";
import morgan from "morgan";
import { errorHandler } from "./middlewares/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import dataBundleRoutes from "./routes/dataBundleRoutes.js";
import agentPriceRoutes from "./routes/agentPriceRoutes.js";
import subAgentPriceRoutes from "./routes/subAgentPriceRoutes.js";

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/bundles", dataBundleRoutes);
app.use("/api/agent-prices", agentPriceRoutes);
app.use("/api/sub-agent-prices", subAgentPriceRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
