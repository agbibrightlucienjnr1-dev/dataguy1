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
