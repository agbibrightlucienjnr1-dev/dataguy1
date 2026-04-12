import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import { errorHandler } from "./middlewares/errorHandler.js";
import { globalRateLimiter } from "./middlewares/rateLimiter.js";
import { standardPaginationLimiter } from "./middlewares/paginationLimiter.js";
import { checkDatabaseHealth } from "./config/database.js";
import authRoutes from "./routes/authRoutes.js";
import dataBundleRoutes from "./routes/dataBundleRoutes.js";
import agentPriceRoutes from "./routes/agentPriceRoutes.js";
import subAgentPriceRoutes from "./routes/subAgentPriceRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import hubnetRoutes from "./routes/hubnetRoutes.js";
import bossuRoutes from "./routes/bossuRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import withdrawalRoutes from "./routes/withdrawalRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import agentRoutes from "./routes/agentRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";

const app = express();

// Trust proxy - important for rate limiting to work correctly behind reverse proxies
// This allows Express to correctly identify client IPs from X-Forwarded-For headers
if (
  process.env.TRUST_PROXY === "true" ||
  process.env.NODE_ENV === "production"
) {
  app.set("trust proxy", 1); // Trust first proxy
}

// Security headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for React
        scriptSrc: ["'self'"], // Only allow scripts from same origin
        imgSrc: ["'self'", "data:", "https:"], // Allow images from same origin, data URIs, and HTTPS
        connectSrc: ["'self'"], // API calls only to same origin
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Disable for compatibility with some services
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
  }),
);

// HTTPS enforcement in production (if not handled by reverse proxy)
if (
  process.env.NODE_ENV === "production" &&
  process.env.ENFORCE_HTTPS === "true"
) {
  app.use((req, res, next) => {
    // Check if request is already HTTPS or forwarded as HTTPS
    if (
      req.header("x-forwarded-proto") !== "https" &&
      req.protocol !== "https"
    ) {
      return res.redirect(`https://${req.header("host")}${req.url}`);
    }
    next();
  });
}

// CORS configuration - restrict to allowed origins
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
  : process.env.NODE_ENV === "production"
    ? [] // Must be set in production
    : ["http://localhost:5173", "http://localhost:3000"]; // Development defaults

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.) in development
      if (!origin && process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);

// Request timeout (30 seconds)
app.use((req, res, next) => {
  req.setTimeout(30000, () => {
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        message: "Request timeout",
      });
    }
  });
  next();
});

// Request size limits to prevent DoS attacks
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

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

// Health check endpoint with database check
app.get("/health", async (req, res) => {
  const dbHealth = await checkDatabaseHealth();

  if (!dbHealth.healthy) {
    return res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: dbHealth,
    });
  }

  // Include memory info in health check (only in development or if requested)
  let memoryInfo = null;
  const includeMemory =
    process.env.NODE_ENV === "development" || req.query.memory === "true";
  if (includeMemory) {
    const { getMemoryUsage } = await import("./utils/memoryMonitor.js");
    memoryInfo = getMemoryUsage();
  }

  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    database: { healthy: true },
    // Only expose environment in development
    ...(process.env.NODE_ENV === "development" && {
      environment: process.env.NODE_ENV,
    }),
    ...(memoryInfo && {
      memory: {
        rss: memoryInfo.formatted.rss,
        heapUsed: memoryInfo.formatted.heapUsed,
        systemUsage: memoryInfo.formatted.systemUsagePercent,
      },
    }),
  });
});

// API routes with pagination limiting
app.use("/api/auth", authRoutes);
app.use("/api/bundles", standardPaginationLimiter, dataBundleRoutes);
app.use("/api/agent-prices", standardPaginationLimiter, agentPriceRoutes);
app.use(
  "/api/sub-agent-prices",
  standardPaginationLimiter,
  subAgentPriceRoutes,
);
app.use("/api/orders", standardPaginationLimiter, orderRoutes);
app.use("/api/wallet", standardPaginationLimiter, walletRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/hubnet", hubnetRoutes);
app.use("/api/bossu", bossuRoutes);
app.use("/api/admin", adminRoutes); // Admin routes have their own pagination limiter
app.use("/api/withdrawals", standardPaginationLimiter, withdrawalRoutes);
app.use("/api/customers", standardPaginationLimiter, customerRoutes);
app.use("/api/agent", standardPaginationLimiter, agentRoutes);
app.use("/api/settings", settingsRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
