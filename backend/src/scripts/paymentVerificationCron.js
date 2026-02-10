/**
 * Payment Verification Cron Job
 *
 * This script periodically checks pending orders and verifies their payment status
 * with Paystack. If a payment has been made but the order is still pending (e.g.,
 * webhook was missed), it will automatically confirm the payment.
 *
 * Usage:
 *   node src/scripts/paymentVerificationCron.js
 *
 * Or add to crontab (run every 5 minutes):
 *   *\/5 * * * * cd /path/to/backend && node src/scripts/paymentVerificationCron.js >> logs/payment-verification.log 2>&1
 *
 * Environment variables:
 *   VERIFICATION_MIN_AGE_MINUTES - Minimum order age to check (default: 1)
 *   VERIFICATION_MAX_AGE_HOURS - Maximum order age to check (default: 24)
 *   VERIFICATION_BATCH_SIZE - Number of orders to check per run (default: 50)
 */

import dotenv from "dotenv";
dotenv.config();

import { initDatabase, closeDatabase } from "../config/database.js";
import { verifyAllPendingPayments } from "../services/paymentVerificationService.js";
import { logger } from "../utils/logger.js";

const VERIFICATION_CONFIG = {
  minAgeMinutes: parseInt(process.env.VERIFICATION_MIN_AGE_MINUTES || "1", 10),
  maxAgeHours: parseInt(process.env.VERIFICATION_MAX_AGE_HOURS || "24", 10),
  limit: parseInt(process.env.VERIFICATION_BATCH_SIZE || "50", 10),
};

async function runVerification() {
  try {
    logger.info("Starting payment verification cron job", VERIFICATION_CONFIG);

    // Initialize database
    await initDatabase();

    // Run verification
    const result = await verifyAllPendingPayments(VERIFICATION_CONFIG);

    if (result.success) {
      logger.success("Payment verification cron completed", {
        checked: result.checked,
        confirmed: result.confirmed,
        alreadyProcessed: result.alreadyProcessed,
        notPaid: result.notPaid,
        errors: result.errors,
        durationMs: result.durationMs,
      });

      // Log details of confirmed payments
      if (result.confirmed > 0) {
        const confirmedOrders = result.details.filter(
          (d) => d.status === "confirmed",
        );
        logger.info("Confirmed payments details", { confirmedOrders });
      }

      // Log errors if any
      if (result.errors > 0) {
        const errorOrders = result.details.filter((d) => d.status === "error");
        logger.warn("Verification errors", { errorOrders });
      }
    } else {
      logger.error("Payment verification cron failed", {
        error: result.error,
      });
    }

    // Close database connection
    await closeDatabase();

    process.exit(result.success ? 0 : 1);
  } catch (error) {
    logger.error("Payment verification cron job failed", {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

// Run verification
runVerification();
