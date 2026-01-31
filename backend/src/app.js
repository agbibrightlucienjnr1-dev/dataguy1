import express from "express";
import cors from "cors";
import morgan from "morgan";
import { errorHandler } from "./middlewares/errorHandler.js";
import { globalRateLimiter } from "./middlewares/rateLimiter.js";
import authRoutes from "./routes/authRoutes.js";
import dataBundleRoutes from "./routes/dataBundleRoutes.js";
import agentPriceRoutes from "./routes/agentPriceRoutes.js";
import subAgentPriceRoutes from "./routes/subAgentPriceRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import hubnetRoutes from "./routes/hubnetRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import withdrawalRoutes from "./routes/withdrawalRoutes.js";

const app = express();

// Trust proxy - important for rate limiting to work correctly behind reverse proxies
// This allows Express to correctly identify client IPs from X-Forwarded-For headers
if (process.env.TRUST_PROXY === "true" || process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1); // Trust first proxy
}

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global rate limiter - applied to all routes as base layer
// This catches extreme abuse (1000 requests per 15 minutes)
// More specific limiters are applied per route
app.use("/api", globalRateLimiter);

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
app.use("/api/orders", orderRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/hubnet", hubnetRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/withdrawals", withdrawalRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
