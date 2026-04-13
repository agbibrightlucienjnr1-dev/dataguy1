import { handleUssdRequest } from "../services/ussdService.js";
import { logger } from "../utils/logger.js";

/**
 * Moolre USSD callback handler
 * POST /api/ussd/callback
 *
 * Moolre sends:
 * {
 *   "sessionId": "3-17074657982460137",
 *   "new": true,
 *   "msisdn": "233241235993",
 *   "network": 3,        // 3=MTN, 5=AT, 6=Telecel
 *   "message": "",
 *   "extension": "109",
 *   "data": "11005"
 * }
 *
 * We respond:
 * {
 *   "message": "Menu text...",
 *   "reply": true  // true = keep session open, false = end
 * }
 */
export const ussdCallback = async (req, res) => {
  try {
    const {
      sessionId,
      new: isNew,
      msisdn,
      network,
      message,
      extension,
      data,
    } = req.body;

    logger.info("USSD callback received", {
      sessionId,
      isNew,
      msisdn,
      network,
      message: message || "(empty)",
      extension,
    });

    if (!sessionId || !msisdn) {
      logger.error("USSD callback missing required fields", { body: req.body });
      return res.status(200).json({
        message: "Service unavailable. Try again later.",
        reply: false,
      });
    }

    const result = await handleUssdRequest({
      sessionId,
      isNew: isNew === true || isNew === "true",
      msisdn,
      message: message || "",
      network, // Moolre network code (3, 5, 6)
    });

    logger.info("USSD response", {
      sessionId,
      stage: "response",
      messageLength: result.message?.length,
      reply: result.reply,
    });

    // Always return 200 with the Moolre-expected format
    return res.status(200).json({
      message: result.message,
      reply: result.reply,
    });
  } catch (error) {
    logger.error("USSD callback error", {
      error: error.message,
      stack: error.stack,
    });

    // Always return 200 — Moolre expects a valid response
    return res.status(200).json({
      message: "An error occurred. Please try again.",
      reply: false,
    });
  }
};
