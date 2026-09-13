import { logger } from "../utils/logger.js";
import { AppError } from "../middlewares/errorHandler.js";
import { getPrisma } from "../config/database.js";

const MOOLRE_SMS_API_URL = "https://api.moolre.com/open/sms/send";

/**
 * Send an SMS via Moolre API
 * @param {string|string[]} recipients - Phone number(s) to send the SMS to
 * @param {string} message - The content of the SMS
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export const sendSMS = async (recipients, message) => {
  const vaskey = process.env.MOOLRE_VASKEY;
  const senderId = process.env.MOOLRE_SMS_SENDER_ID;

  if (!vaskey || !senderId || vaskey === "your-vaskey-here" || senderId === "your-sender-id-here") {
    logger.warn("SMS sending skipped: MOOLRE_VASKEY or MOOLRE_SMS_SENDER_ID is missing or still set to defaults in environment variables.");
    return { success: false, message: "SMS configuration is missing or invalid in server environment." };
  }

  try {
    // Clean and prepare recipient array
    const recipientArray = Array.isArray(recipients) ? recipients : [recipients];
    
    // Check if there are actually any valid recipients
    const validRecipients = recipientArray.filter(r => r && r.trim().length > 0);
    if (validRecipients.length === 0) {
      logger.warn("SMS sending skipped: No valid recipients provided.");
      return { success: false, message: "No valid recipients found." };
    }

    const messagesPayload = validRecipients.map((recipient) => ({
      recipient: recipient.trim(),
      message: message.trim(),
    }));

    const payload = {
      type: 1, // Required by Moolre SMS API
      senderid: senderId,
      messages: messagesPayload,
    };

    logger.info("Sending SMS", { 
      recipientCount: validRecipients.length,
      sampleRecipient: validRecipients[0]
    });

    const response = await fetch(MOOLRE_SMS_API_URL, {
      method: "POST",
      headers: {
        "X-API-VASKEY": vaskey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || data.status !== 1) {
      logger.error("Failed to send Moolre SMS", data);
      throw new AppError(data.message || "Failed to send SMS", response.status || 400);
    }

    logger.info("SMS sent successfully", { code: data.code, message: data.message });
    return { success: true, message: data.message };

  } catch (error) {
    logger.error("Error sending SMS", { error: error.message || error });
    // Don't throw for automated flows to prevent crashing order logic, 
    // but the caller can handle it if needed.
    return { success: false, message: error.message || "SMS Provider API Error" };
  }
};

/**
 * Notify administrators when an order fails to process.
 * Suppresses duplicate SMS notifications for:
 * 1. The same order if an SMS alert was already sent (e.g. during automatic retries).
 * 2. New failed orders if an active, unresolved failed order alert already exists.
 * 
 * @param {string} orderId - The order ID
 * @param {string} provider - The delivery provider (e.g. 'Hubnet' or 'Bossu')
 * @param {string} reason - The reason for failure
 */
export const notifyAdminOfFailedOrder = async (orderId, provider, reason) => {
  try {
    const prisma = getPrisma();

    if (!orderId) {
      logger.warn("notifyAdminOfFailedOrder called without orderId, skipping notification");
      return;
    }

    // Check target order notification state
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, adminNotified: true },
    });

    if (!order) {
      logger.warn(`notifyAdminOfFailedOrder: Order ${orderId} not found`);
      return;
    }

    // 1. Check if this order itself was already notified
    if (order.adminNotified) {
      logger.info(`Admin SMS alert already sent for order ${orderId}, skipping duplicate notification.`);
      return;
    }

    // 2. Check if another active unresolved failed order already triggered an SMS alert
    const activeUnresolvedFailure = await prisma.order.findFirst({
      where: {
        status: "failed",
        adminNotified: true,
        id: { not: orderId },
      },
      select: { id: true },
    });

    if (activeUnresolvedFailure) {
      // Mark current order as notified so it won't re-trigger later, but suppress SMS dispatch
      await prisma.order.update({
        where: { id: orderId },
        data: { adminNotified: true },
      });
      logger.info(
        `Active unresolved failed order (${activeUnresolvedFailure.id}) already alerted admins. Suppressing SMS dispatch for order ${orderId}.`
      );
      return;
    }

    // Mark current order as notified BEFORE sending SMS to ensure atomicity
    await prisma.order.update({
      where: { id: orderId },
      data: { adminNotified: true },
    });

    const admins = await prisma.user.findMany({ 
      where: { role: "admin" },
      select: { phone: true }
    });

    if (admins && admins.length > 0) {
      const adminPhones = admins.map(admin => admin.phone).filter(Boolean);
      const shortId = orderId ? orderId.toString().slice(-6).toUpperCase() : 'UNKNOWN';
      const cleanReason = reason ? reason.substring(0, 50) : 'Unknown error';
      
      const message = `URGENT: Order ${shortId} failed at ${provider}. Reason: ${cleanReason}. Please check the dashboard to manually resolve it.`;
      
      // Dispatch asynchronously without awaiting to prevent blocking
      sendSMS(adminPhones, message).catch(err => {
        logger.error("Failed to send admin notification SMS", { error: err.message });
      });
    }
  } catch (error) {
    logger.error("Failed in notifyAdminOfFailedOrder", { error: error.message });
  }
};
