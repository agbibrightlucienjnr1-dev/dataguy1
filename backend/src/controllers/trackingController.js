import { trackEvent } from "../services/analyticsService.js";

/**
 * Handle incoming tracking beacons from the frontend silently
 */
export const captureEvent = async (req, res) => {
  try {
    const { sessionId, eventType, path, sellerId, device } = req.body;

    // Validate strictly required tracking properties
    if (!sessionId || !eventType) {
      return res.status(400).json({ status: "error", message: "Missing sessionId or eventType" });
    }

    // Pass off to the service but return a 200 OK instantly to the client 
    // to prevent any frontend blocking/lag on analytics calls.
    trackEvent({
      sessionId,
      eventType,
      path: path || "/",
      sellerId: sellerId || null,
      device: device || "Desktop"
    });

    return res.status(200).json({ status: "success", message: "Tracked" });
  } catch (error) {
    // Fail silently on the API so the frontend never sees an error.
    return res.status(200).json({ status: "error", message: "Ignored" });
  }
};
