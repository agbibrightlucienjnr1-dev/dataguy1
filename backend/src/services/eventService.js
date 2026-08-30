import { getPrisma } from "../config/database.js";
import { AppError } from "../middlewares/errorHandler.js";
import { initializeTransaction, verifyTransaction } from "./paystackService.js";
import { logger } from "../utils/logger.js";

const DEFAULT_EVENT_SLUG = "ai-video-masterclass";

/**
 * Ensure the default AI Video Masterclass event exists in database
 */
export const ensureDefaultEvent = async () => {
  const prisma = getPrisma();
  let event = await prisma.event.findUnique({
    where: { slug: DEFAULT_EVENT_SLUG },
  });

  if (!event) {
    event = await prisma.event.create({
      data: {
        slug: DEFAULT_EVENT_SLUG,
        title: "AI Video Creation Masterclass (Long & Short Form)",
        description:
          "Learn how to create high-quality, viral short-form and long-form videos with AI tools. Scripting, voice cloning, photorealistic AI avatars, dynamic editing, and monetization.",
        price: 20.0,
        eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        whatsappGroupLink:
          process.env.DEFAULT_EVENT_WHATSAPP_LINK ||
          "https://chat.whatsapp.com/invite-placeholder",
        isActive: true,
      },
    });
    logger.info("Created default AI Video Masterclass event", { id: event.id });
  }

  return event;
};

/**
 * Get public event information by slug
 */
export const getEventBySlug = async (slug = DEFAULT_EVENT_SLUG) => {
  const prisma = getPrisma();

  let event = await prisma.event.findUnique({
    where: { slug },
  });

  if (!event && slug === DEFAULT_EVENT_SLUG) {
    event = await ensureDefaultEvent();
  }

  if (!event) {
    throw new AppError("Event not found", 404);
  }

  if (!event.isActive) {
    throw new AppError("Registration for this event is currently closed", 400);
  }

  // Return public properties (do NOT expose whatsappGroupLink here - only after verified payment)
  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    description: event.description,
    price: parseFloat(event.price.toString()),
    eventDate: event.eventDate,
    isActive: event.isActive,
  };
};

/**
 * Register for an event and initialize Paystack payment
 */
export const registerForEvent = async ({
  slug = DEFAULT_EVENT_SLUG,
  fullName,
  phone,
  email,
  callbackUrl,
}) => {
  const prisma = getPrisma();

  if (!fullName || !phone) {
    throw new AppError("Full name and phone number are required", 400);
  }

  // Clean phone number
  const cleanPhone = phone.replace(/[\s-]/g, "");

  // Fallback email for Paystack requirement if not provided
  const participantEmail =
    email && email.trim() !== ""
      ? email.trim().toLowerCase()
      : `${cleanPhone}@event.dataguy.store`;

  let event = await prisma.event.findUnique({
    where: { slug },
  });

  if (!event && slug === DEFAULT_EVENT_SLUG) {
    event = await ensureDefaultEvent();
  }

  if (!event || !event.isActive) {
    throw new AppError("Event is not available for registration", 400);
  }

  const amount = parseFloat(event.price.toString());
  const paymentReference = `EVT_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 7)
    .toUpperCase()}`;

  // Create pending registration record
  const registration = await prisma.eventRegistration.create({
    data: {
      eventId: event.id,
      fullName: fullName.trim(),
      phone: cleanPhone,
      email: email ? email.trim().toLowerCase() : null,
      amountPaid: amount,
      paymentReference,
      paymentProvider: "paystack",
      status: "pending",
    },
  });

  logger.info("Created pending event registration", {
    registrationId: registration.id,
    paymentReference,
    amount,
  });

  // Initialize Paystack checkout
  try {
    const paystackResult = await initializeTransaction({
      email: participantEmail,
      amount,
      reference: paymentReference,
      callbackUrl:
        callbackUrl || `${process.env.FRONTEND_URL || ""}/payment/callback`,
      metadata: {
        type: "event_registration",
        eventId: event.id,
        eventSlug: event.slug,
        registrationId: registration.id,
        fullName: fullName.trim(),
        phone: cleanPhone,
      },
    });

    return {
      success: true,
      registrationId: registration.id,
      paymentReference,
      authorizationUrl: paystackResult.authorizationUrl,
      accessCode: paystackResult.accessCode,
      amount,
      eventTitle: event.title,
    };
  } catch (error) {
    logger.error("Paystack transaction initialization failed for event", error);
    // Delete the pending registration if checkout initialization completely fails
    await prisma.eventRegistration.delete({
      where: { id: registration.id },
    });
    throw error;
  }
};

/**
 * Verify event payment and return WhatsApp access link upon confirmation
 */
export const verifyEventPayment = async (reference) => {
  const prisma = getPrisma();

  const registration = await prisma.eventRegistration.findUnique({
    where: { paymentReference: reference },
    include: { event: true },
  });

  if (!registration) {
    throw new AppError("Registration record not found for this reference", 404);
  }

  // If already confirmed, return instant access details
  if (registration.status === "confirmed") {
    return {
      success: true,
      status: "confirmed",
      fullName: registration.fullName,
      phone: registration.phone,
      eventTitle: registration.event.title,
      whatsappGroupLink: registration.event.whatsappGroupLink,
      registeredAt: registration.createdAt,
    };
  }

  // Verify transaction status with Paystack
  const verification = await verifyTransaction(reference);

  if (verification.success && verification.status === "success") {
    // Update status to confirmed
    const updated = await prisma.eventRegistration.update({
      where: { id: registration.id },
      data: { status: "confirmed" },
      include: { event: true },
    });

    logger.success("Event payment verified and registration confirmed", {
      registrationId: updated.id,
      reference,
      phone: updated.phone,
    });

    return {
      success: true,
      status: "confirmed",
      fullName: updated.fullName,
      phone: updated.phone,
      eventTitle: updated.event.title,
      whatsappGroupLink: updated.event.whatsappGroupLink,
      registeredAt: updated.createdAt,
    };
  }

  return {
    success: false,
    status: registration.status,
    message: "Payment is still processing or was not completed",
  };
};

/**
 * Admin: Get registrations for an event with pagination and summary stats
 */
export const getEventRegistrations = async ({
  slug = DEFAULT_EVENT_SLUG,
  page = 1,
  limit = 50,
  search = "",
  status,
}) => {
  const prisma = getPrisma();

  const event = await prisma.event.findUnique({
    where: { slug },
  });

  if (!event) {
    throw new AppError("Event not found", 404);
  }

  const where = {
    eventId: event.id,
    ...(status && { status }),
    ...(search && {
      OR: [
        { fullName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { paymentReference: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const skip = (page - 1) * limit;

  const [registrations, totalCount, confirmedCount, totalRevenueResult] =
    await Promise.all([
      prisma.eventRegistration.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.eventRegistration.count({ where }),
      prisma.eventRegistration.count({
        where: { eventId: event.id, status: "confirmed" },
      }),
      prisma.eventRegistration.aggregate({
        where: { eventId: event.id, status: "confirmed" },
        _sum: { amountPaid: true },
      }),
    ]);

  return {
    event: {
      id: event.id,
      slug: event.slug,
      title: event.title,
      price: parseFloat(event.price.toString()),
      whatsappGroupLink: event.whatsappGroupLink,
      isActive: event.isActive,
    },
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
    stats: {
      totalRegistrations: totalCount,
      confirmedParticipants: confirmedCount,
      totalRevenue: parseFloat(
        (totalRevenueResult._sum.amountPaid || 0).toString(),
      ),
    },
    registrations: registrations.map((r) => ({
      id: r.id,
      fullName: r.fullName,
      phone: r.phone,
      email: r.email,
      amountPaid: parseFloat(r.amountPaid.toString()),
      paymentReference: r.paymentReference,
      status: r.status,
      createdAt: r.createdAt,
    })),
  };
};

/**
 * Admin: Update event details (WhatsApp link, price, active state)
 */
export const updateEvent = async (slug, data) => {
  const prisma = getPrisma();

  const event = await prisma.event.findUnique({
    where: { slug },
  });

  if (!event) {
    throw new AppError("Event not found", 404);
  }

  const updated = await prisma.event.update({
    where: { slug },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.price !== undefined && { price: parseFloat(data.price) }),
      ...(data.whatsappGroupLink !== undefined && {
        whatsappGroupLink: data.whatsappGroupLink,
      }),
      ...(data.isActive !== undefined && { isActive: Boolean(data.isActive) }),
      ...(data.eventDate !== undefined && {
        eventDate: new Date(data.eventDate),
      }),
    },
  });

  return updated;
};
