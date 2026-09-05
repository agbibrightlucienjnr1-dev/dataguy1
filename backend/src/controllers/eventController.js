import { asyncHandler } from "../middlewares/errorHandler.js";
import {
  getEventBySlug,
  registerForEvent,
  verifyEventPayment,
  getEventRegistrations,
  updateEvent,
} from "../services/eventService.js";

/**
 * Get event details
 * GET /api/events/:slug?
 */
export const getEvent = asyncHandler(async (req, res) => {
  const slug = req.params.slug || "ai-video-masterclass";
  const event = await getEventBySlug(slug);

  res.status(200).json({
    success: true,
    data: event,
  });
});

/**
 * Register for event and get Paystack authorization
 * POST /api/events/:slug?/register
 */
export const register = asyncHandler(async (req, res) => {
  const slug = req.params.slug || "ai-video-masterclass";
  const { fullName, phone, email, callbackUrl } = req.body;

  const result = await registerForEvent({
    slug,
    fullName,
    phone,
    email,
    callbackUrl,
  });

  res.status(201).json({
    success: true,
    message: "Registration initiated successfully",
    data: result,
  });
});

/**
 * Verify event payment and retrieve access link
 * GET /api/events/verify/:reference
 */
export const verifyPayment = asyncHandler(async (req, res) => {
  const { reference } = req.params;

  const result = await verifyEventPayment(reference);

  res.status(200).json({
    success: result.success,
    data: result,
  });
});

/**
 * Admin: Get event registrations
 * GET /api/events/:slug?/admin/registrations
 */
export const getAdminRegistrations = asyncHandler(async (req, res) => {
  const slug = req.params.slug || "ai-video-masterclass";
  const page = parseInt(req.query.page || "1", 10);
  const limit = parseInt(req.query.limit || "50", 10);
  const search = req.query.search || "";
  const status = req.query.status;

  const result = await getEventRegistrations({
    slug,
    page,
    limit,
    search,
    status,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * Admin: Update event details
 * PUT /api/events/:slug?/admin
 */
export const updateEventDetails = asyncHandler(async (req, res) => {
  const slug = req.params.slug || "ai-video-masterclass";
  const updated = await updateEvent(slug, req.body);

  res.status(200).json({
    success: true,
    message: "Event updated successfully",
    data: updated,
  });
});
