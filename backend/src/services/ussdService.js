import { getPrisma } from "../config/database.js";
import { AppError } from "../middlewares/errorHandler.js";
import { logger } from "../utils/logger.js";
import { getActivePaymentProvider, getSystemSettings } from "./settingsService.js";
import { chargeViaMobileMoney, submitPaystackOTP } from "./paystackService.js";
import { initiateMoolrePayment } from "./moolreService.js";
import { upsertCustomerOnOrderPlacement } from "./customerService.js";
import { trackEvent } from "./analyticsService.js";
import { Prisma } from "@prisma/client";

// Network mapping for display and Moolre channel codes
const NETWORKS = [
  { key: "MTN", label: "MTN", moolreChannel: "13" },
  { key: "TELECEL", label: "Telecel", moolreChannel: "6" },
  { key: "AT", label: "AirtelTigo", moolreChannel: "7" },
];

const BUNDLES_PER_PAGE = 4; // Keep under 160 char USSD limit

/**
 * Format phone number for consistent storage
 * Moolre sends msisdn as 233XXXXXXXXX — convert to 0XXXXXXXXX
 */
const formatPhone = (msisdn) => {
  if (!msisdn) return msisdn;
  let phone = msisdn.toString().trim();
  if (phone.startsWith("233")) {
    phone = "0" + phone.slice(3);
  }
  return phone;
};

/**
 * Format phone for Moolre/Paystack (needs 233 prefix)
 */
const toInternationalPhone = (phone) => {
  if (!phone) return phone;
  let p = phone.toString().trim();
  if (p.startsWith("0")) {
    p = "233" + p.slice(1);
  }
  return p;
};

/**
 * Main USSD state machine handler
 * 
 * Returns { message: string, reply: boolean }
 */
export const handleUssdRequest = async ({ sessionId, isNew, msisdn, message, network: moolreNetwork }) => {
  const prisma = getPrisma();

  try {
    // ==========================================
    // CUSTOMER ELIGIBILITY CHECK
    // Only customers who have completed at least one web order
    // can access USSD. We check two sources and two phone formats
    // to be resilient against counter drift and format differences.
    // ==========================================
    const callerPhone = formatPhone(msisdn);               // 0XXXXXXXXX
    const callerPhoneIntl = toInternationalPhone(callerPhone); // 233XXXXXXXXX

    const settings = await getSystemSettings();
    let isEligible = false;

    if (settings.allowAllUssdAccess) {
      isEligible = true;
    } else {
      // Pass 1: Customer table (fast path — both phone formats)
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          phone: { in: [callerPhone, callerPhoneIntl] },
        },
        select: { phone: true, successfulOrdersCount: true },
      });

      isEligible = (existingCustomer?.successfulOrdersCount ?? 0) > 0;

      // Pass 2: Direct order lookup (fallback for stale/missing counters).
      // Handles customers whose orders completed before the tracking counter
      // was set up, or whose counter was never incremented due to a bug.
      if (!isEligible) {
        const completedOrder = await prisma.order.findFirst({
          where: {
            customerPhone: { in: [callerPhone, callerPhoneIntl] },
            status: "completed",
          },
          select: { id: true },
        });
        isEligible = completedOrder !== null;
      }

      logger.info("USSD eligibility check", {
        sessionId,
        callerPhone,
        customerRecordFound: !!existingCustomer,
        successfulOrdersCount: existingCustomer?.successfulOrdersCount ?? null,
        isEligible,
      });
    }

    if (!isEligible) {
      return {
        message:
          "UNKNOWN APPLICATION",
        reply: false,
      };
    }


    // ==========================================
    // NEW SESSION — Welcome and ask for agent code
    // ==========================================
    if (isNew) {
      // Track the USSD visit
      trackEvent({
        sessionId,
        eventType: "USSD_DIAL",
        path: "*203*138#",
        sellerId: null,
        device: "Feature Phone / USSD",
      }).catch((e) => logger.error("USSD tracking error", { e }));

      // Create/reset session
      await prisma.ussdSession.upsert({
        where: { id: sessionId },
        create: {
          id: sessionId,
          msisdn: msisdn,
          stage: "AWAIT_AGENT",
          updatedAt: new Date(),
        },
        update: {
          msisdn: msisdn,
          stage: "AWAIT_AGENT",
          agentId: null,
          network: null,
          bundleId: null,
          recipient: null,
          page: 0,
          orderId: null,
          updatedAt: new Date(),
        },
      });

      return {
        message: "Welcome to DataGuy!\nEnter Agent Code:",
        reply: true,
      };
    }

    // ==========================================
    // CONTINUING SESSION — Load state
    // ==========================================
    let session = await prisma.ussdSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      // Session expired or not found, restart
      await prisma.ussdSession.create({
        data: {
          id: sessionId,
          msisdn: msisdn,
          stage: "AWAIT_AGENT",
          updatedAt: new Date(),
        },
      });

      return {
        message: "Welcome to DataGuy!\nEnter Agent Code:",
        reply: true,
      };
    }

    const input = (message || "").trim();

    // Route to the correct handler based on stage
    switch (session.stage) {
      case "AWAIT_AGENT":
        return await handleAgentCode(prisma, session, input);

      case "AWAIT_NETWORK":
        return await handleNetworkSelection(prisma, session, input);

      case "AWAIT_BUNDLE":
        return await handleBundleSelection(prisma, session, input);

      case "AWAIT_RECIPIENT":
        return await handleRecipient(prisma, session, input);

      case "CONFIRMATION":
        return await handleConfirmation(prisma, session, input, moolreNetwork);

      case "AWAITING_PAYMENT_OTP":
        return await handleAwaitingOTP(prisma, session, input);

      default:
        // Unknown stage, restart
        await prisma.ussdSession.update({
          where: { id: session.id },
          data: { stage: "AWAIT_AGENT", updatedAt: new Date() },
        });
        return {
          message: "Welcome to DataGuy!\nEnter Agent Code:",
          reply: true,
        };
    }
  } catch (error) {
    logger.error("USSD service error", {
      sessionId,
      error: error.message,
      stack: error.stack,
    });

    return {
      message: "An error occurred. Please try again later.",
      reply: false,
    };
  }
};

// ==========================================
// STAGE HANDLERS
// ==========================================

/**
 * Stage: AWAIT_AGENT
 * User enters an agent code (integer).
 */
async function handleAgentCode(prisma, session, input) {
  const code = parseInt(input, 10);

  if (isNaN(code) || code < 1) {
    return {
      message: "Invalid code. Enter Agent Code:",
      reply: true,
    };
  }

  // Look up agent by agentCode
  const agent = await prisma.user.findUnique({
    where: { agentCode: code },
    select: { id: true, name: true, shopName: true, role: true },
  });

  if (!agent || agent.role === "admin") {
    return {
      message: "Agent not found.\nEnter a valid Agent Code:",
      reply: true,
    };
  }

  // Save agent and advance
  await prisma.ussdSession.update({
    where: { id: session.id },
    data: {
      agentId: agent.id,
      stage: "AWAIT_NETWORK",
      updatedAt: new Date(),
    },
  });

  const shopDisplay = agent.shopName || agent.name;

  let msg = `${shopDisplay}\nChoose Network:\n`;
  NETWORKS.forEach((n, i) => {
    msg += `${i + 1}. ${n.label}\n`;
  });

  return { message: msg.trim(), reply: true };
}

/**
 * Stage: AWAIT_NETWORK
 * User picks from numbered network options.
 */
async function handleNetworkSelection(prisma, session, input) {
  const choice = parseInt(input, 10);

  if (isNaN(choice) || choice < 1 || choice > NETWORKS.length) {
    let msg = "Invalid option.\nChoose Network:\n";
    NETWORKS.forEach((n, i) => {
      msg += `${i + 1}. ${n.label}\n`;
    });
    return { message: msg.trim(), reply: true };
  }

  const selected = NETWORKS[choice - 1];

  await prisma.ussdSession.update({
    where: { id: session.id },
    data: {
      network: selected.key,
      page: 0,
      stage: "AWAIT_BUNDLE",
      updatedAt: new Date(),
    },
  });

  // Fetch bundles for this agent & network
  return await showBundles(prisma, session.id, session.agentId, selected.key, 0);
}

/**
 * Stage: AWAIT_BUNDLE
 * User picks bundle or 9 to paginate.
 */
async function handleBundleSelection(prisma, session, input) {
  const choice = parseInt(input, 10);

  // Fetch current page of bundles
  const bundles = await getAgentBundles(prisma, session.agentId, session.network);
  const startIdx = session.page * BUNDLES_PER_PAGE;
  const pageBundles = bundles.slice(startIdx, startIdx + BUNDLES_PER_PAGE);
  const hasMore = bundles.length > startIdx + BUNDLES_PER_PAGE;

  // Handle pagination (9 = next page)
  if (choice === 9 && hasMore) {
    const newPage = session.page + 1;
    await prisma.ussdSession.update({
      where: { id: session.id },
      data: { page: newPage, updatedAt: new Date() },
    });
    return await showBundles(prisma, session.id, session.agentId, session.network, newPage);
  }

  // Handle "0" = previous page
  if (choice === 0 && session.page > 0) {
    const newPage = session.page - 1;
    await prisma.ussdSession.update({
      where: { id: session.id },
      data: { page: newPage, updatedAt: new Date() },
    });
    return await showBundles(prisma, session.id, session.agentId, session.network, newPage);
  }

  if (isNaN(choice) || choice < 1 || choice > pageBundles.length) {
    return await showBundles(prisma, session.id, session.agentId, session.network, session.page);
  }

  const selectedBundle = pageBundles[choice - 1];

  await prisma.ussdSession.update({
    where: { id: session.id },
    data: {
      bundleId: selectedBundle.id,
      stage: "AWAIT_RECIPIENT",
      updatedAt: new Date(),
    },
  });

  return {
    message: "Enter recipient number\nor 0 to use your number:",
    reply: true,
  };
}

/**
 * Stage: AWAIT_RECIPIENT
 * User enters a phone number or 0 for self.
 */
async function handleRecipient(prisma, session, input) {
  let recipient;

  if (input === "0") {
    recipient = formatPhone(session.msisdn);
  } else {
    // Strip ALL non-digit characters (USSD platforms can send hyphens,
    // spaces, or other artifacts alongside the digits).
    const cleaned = input.replace(/\D/g, "");

    if (/^0\d{9}$/.test(cleaned)) {
      // Standard local format: 0XXXXXXXXX (10 digits)
      recipient = cleaned;
    } else if (/^233\d{9}$/.test(cleaned)) {
      // International format: 233XXXXXXXXX (12 digits)
      recipient = "0" + cleaned.slice(3);
    } else if (/^\d{9}$/.test(cleaned)) {
      // 9 digits — user omitted the leading 0, prepend it
      recipient = "0" + cleaned;
    } else {
      return {
        message: "Invalid number.\nEnter a valid 10-digit number\nor 0 to use your number:",
        reply: true,
      };
    }
  }

  // Fetch bundle info for confirmation
  const bundle = await prisma.dataBundle.findUnique({
    where: { id: session.bundleId },
  });

  if (!bundle) {
    return { message: "Bundle no longer available.", reply: false };
  }

  // Get price for this agent
  const price = await getAgentPrice(prisma, session.agentId, session.bundleId);
  if (!price) {
    return { message: "Pricing not available.", reply: false };
  }

  // Calculate fee
  const settings = await getSystemSettings();
  const provider = settings.activePaymentProvider;
  const priceNum = parseFloat(price.toString());

  let feeValue;
  if (provider === "moolre") {
    feeValue = priceNum * (parseFloat(settings.moolreFeePercentage.toString()) / 100);
  } else {
    if (priceNum < 20) {
      feeValue = parseFloat(settings.paystackFlatFee.toString());
    } else {
      feeValue = priceNum * (parseFloat(settings.paystackFeePercentage.toString()) / 100);
    }
  }

  const total = (priceNum + feeValue).toFixed(2);

  await prisma.ussdSession.update({
    where: { id: session.id },
    data: {
      recipient,
      stage: "CONFIRMATION",
      updatedAt: new Date(),
    },
  });

  return {
    message: `${bundle.network} ${bundle.volume}\nTo: ${recipient}\nTotal: GHS ${total}\n\n1. Confirm\n2. Cancel`,
    reply: true,
  };
}

/**
 * Stage: CONFIRMATION
 * User confirms (1) or cancels (2).
 */
async function handleConfirmation(prisma, session, input, moolreNetwork) {
  if (input === "2") {
    // Cleanup session
    await prisma.ussdSession.delete({ where: { id: session.id } }).catch(() => { });
    return { message: "Order cancelled.", reply: false };
  }

  if (input !== "1") {
    return { message: "Press 1 to Confirm\nor 2 to Cancel:", reply: true };
  }

  // ---- CREATE ORDER & INITIATE PAYMENT ----
  const bundle = await prisma.dataBundle.findUnique({
    where: { id: session.bundleId },
  });

  if (!bundle || !bundle.isActive) {
    return { message: "Bundle no longer available.", reply: false };
  }

  // Get agent
  const agent = await prisma.user.findUnique({
    where: { id: session.agentId },
    select: { id: true, name: true, role: true, phone: true },
  });

  if (!agent) {
    return { message: "Agent not found.", reply: false };
  }

  // Get price
  const pricePaid = await getAgentPrice(prisma, agent.id, bundle.id);
  if (!pricePaid) {
    return { message: "Pricing not available.", reply: false };
  }

  // Calculate transaction fee (same logic as publicOrderService)
  const settings = await getSystemSettings();
  const activeProvider = settings.activePaymentProvider;
  const providerKey = activeProvider === "moolre" ? "moolre" : "paystack";

  const priceAsNumber = parseFloat(pricePaid.toString());
  let transactionFeeValue;

  if (providerKey === "moolre") {
    transactionFeeValue = new Prisma.Decimal(pricePaid.toString())
      .mul(new Prisma.Decimal(settings.moolreFeePercentage.toString()).div(100));
  } else {
    if (priceAsNumber < 20) {
      transactionFeeValue = settings.paystackFlatFee;
    } else {
      transactionFeeValue = new Prisma.Decimal(pricePaid.toString())
        .mul(new Prisma.Decimal(settings.paystackFeePercentage.toString()).div(100));
    }
  }

  const transactionFee = new Prisma.Decimal(transactionFeeValue.toString());
  const totalAmount = new Prisma.Decimal(pricePaid.toString()).add(transactionFee);

  const customerPhone = session.recipient;
  const sellerType = agent.role === "sub_agent" ? "sub_agent" : "agent";

  // Upsert customer
  await upsertCustomerOnOrderPlacement({
    customerPhone,
    customerName: null,
    orderCreatedAt: new Date(),
  });

  // Create the order
  const order = await prisma.order.create({
    data: {
      customerPhone,
      customerName: null,
      bundleId: bundle.id,
      sellerId: agent.id,
      sellerType,
      pricePaid,
      transactionFee,
      status: "pending",
      paymentProvider: activeProvider,
    },
    include: {
      bundle: true,
      seller: {
        select: { id: true, name: true, phone: true, role: true },
      },
    },
  });

  logger.info("USSD order created", {
    orderId: order.id,
    customerPhone,
    bundle: `${bundle.network} ${bundle.volume}`,
    agent: agent.name,
    total: totalAmount.toString(),
    provider: activeProvider,
  });

  // Save orderId to session
  await prisma.ussdSession.update({
    where: { id: session.id },
    data: { orderId: order.id, updatedAt: new Date() },
  });

  // ---- INITIATE PAYMENT ----
  const payerPhone = formatPhone(session.msisdn); // Charge the dialing number

  try {
    if (activeProvider === "moolre") {
      // Map Moolre's inbound network integer to the network key used by getNetworkCode().
      // Moolre sends: 3=MTN, 5=AT, 6=Telecel — this is the CALLER's mobile network,
      // which is what we must charge, regardless of which data network they are buying.
      const MOOLRE_NETWORK_MAP = { 3: "MTN", 5: "AT", 6: "TELECEL" };
      const callerNetworkKey =
        MOOLRE_NETWORK_MAP[moolreNetwork] || bundle.network;

      logger.info("Initiating Moolre USSD payment", {
        orderId: order.id,
        moolreNetwork,
        callerNetworkKey,
        payerPhone: toInternationalPhone(payerPhone),
      });

      await initiateMoolrePayment({
        amount: totalAmount,
        phone: toInternationalPhone(payerPhone),
        network: callerNetworkKey,
        reference: order.id,
      });

      return {
        message: "Payment prompt sent to your phone.\nAuthorize to complete purchase.",
        reply: false,
      };
    } else {
      // Paystack mobile money charge — sends a MoMo PIN prompt directly
      // to the customer's phone. No web redirect needed.
      const MOOLRE_NETWORK_MAP = { 3: "MTN", 5: "AT", 6: "TELECEL" };
      const callerNetworkKey =
        MOOLRE_NETWORK_MAP[moolreNetwork] || bundle.network;

      const paystackResult = await chargeViaMobileMoney({
        amount: totalAmount,
        phone: payerPhone,          // local format: 0XXXXXXXXX
        network: callerNetworkKey,
        reference: order.id,
        email: payerPhone + "@customer.dataguy.com",
      });

      if (paystackResult.status === "send_otp" || paystackResult.status === "send_pin") {
         await prisma.ussdSession.update({
           where: { id: session.id },
           data: { stage: "AWAITING_PAYMENT_OTP" }
         });
         return {
           message: paystackResult.displayText || "Paystack has sent an SMS verification code to your number. Please enter it here directly:",
           reply: true,
         };
      }

      return {
        message: "Payment prompt sent to your phone.\nAuthorize to complete purchase or check approvals (*170#).",
        reply: false,
      };
    }
  } catch (payError) {
    logger.error("USSD payment initiation failed", {
      orderId: order.id,
      error: payError.message,
      stack: payError.stack,
    });

    return {
      message: "Order created but payment failed.\nPlease try again.",
      reply: false,
    };
  }
}

// ==========================================
// STAGE HANDLERS
// ==========================================

/**
 * Stage: AWAITING_PAYMENT_OTP
 * User enters an SMS OTP for Paystack initial verification or network voucher.
 */
async function handleAwaitingOTP(prisma, session, input) {
  if (!input) {
    return {
      message: "Input cannot be empty. Please enter the verification code sent to your phone:",
      reply: true,
    };
  }

  if (input === "0") {
    // Cancel logic
    await prisma.ussdSession.update({
      where: { id: session.id },
      data: { stage: "AWAIT_NETWORK", bundleId: null, recipient: null, orderId: null },
    });
    return {
      message: "Payment cancelled. Select Network:\n1. MTN\n2. Telecel\n3. AirtelTigo",
      reply: true,
    };
  }

  // Submit OTP payload
  try {
    const otpResult = await submitPaystackOTP(session.orderId, input);

    if (otpResult.status === "send_otp" || otpResult.status === "send_pin") {
      return {
        message: otpResult.message || "Incorrect code. Please enter the OTP again (0 to cancel):",
        reply: true,
      };
    }

    return {
      message: "Verification successful! The payment prompt has been pushed to your phone. Please authorize to complete the purchase.",
      reply: false,
    };
  } catch (error) {
    logger.error("USSD Paystack OTP submission failed", {
      orderId: session.orderId,
      error: error.message,
    });

    return {
      message: "Failed to verify the OTP. " + (error.message || "Please try placing the order again."),
      reply: false,
    };
  }
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Convert a volume string (e.g. "500MB", "1GB", "1.5GB") to megabytes
 * for correct numeric sorting.
 */
function parseVolumeToMB(volume) {
  if (!volume) return 0;
  const str = volume.toString().toUpperCase().trim();
  const match = str.match(/^([\d.]+)\s*(GB|MB)$/);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  return match[2] === "GB" ? num * 1024 : num;
}

/**
 * Get bundles for agent + network, with agent pricing
 */
async function getAgentBundles(prisma, agentId, networkKey) {
  const agent = await prisma.user.findUnique({
    where: { id: agentId },
    select: { role: true },
  });

  const bundles = await prisma.dataBundle.findMany({
    where: { network: networkKey, isActive: true },
    orderBy: { volume: "asc" },
  });

  let pricesMap = new Map();

  if (agent.role === "agent") {
    const prices = await prisma.agentPrice.findMany({
      where: { agentId },
      select: { bundleId: true, customerPrice: true },
    });
    prices.forEach((p) => pricesMap.set(p.bundleId, p.customerPrice));
  } else if (agent.role === "sub_agent") {
    const prices = await prisma.subAgentPrice.findMany({
      where: { subAgentId: agentId },
      select: { bundleId: true, customerPrice: true },
    });
    prices.forEach((p) => pricesMap.set(p.bundleId, p.customerPrice));
  }

  return bundles
    .filter((b) => pricesMap.has(b.id))
    .map((b) => ({
      id: b.id,
      network: b.network,
      volume: b.volume,
      price: pricesMap.get(b.id),
    }))
    .sort((a, b) => parseVolumeToMB(a.volume) - parseVolumeToMB(b.volume));
}

/**
 * Get agent's customer price for a specific bundle
 */
async function getAgentPrice(prisma, agentId, bundleId) {
  const agent = await prisma.user.findUnique({
    where: { id: agentId },
    select: { role: true },
  });

  if (agent.role === "agent") {
    const ap = await prisma.agentPrice.findUnique({
      where: { agentId_bundleId: { agentId, bundleId } },
    });
    return ap?.customerPrice || null;
  } else {
    const sp = await prisma.subAgentPrice.findUnique({
      where: { subAgentId_bundleId: { subAgentId: agentId, bundleId } },
    });
    return sp?.customerPrice || null;
  }
}

/**
 * Show paginated bundle list
 */
async function showBundles(prisma, sessionId, agentId, networkKey, page) {
  const bundles = await getAgentBundles(prisma, agentId, networkKey);

  if (bundles.length === 0) {
    // Go back to network selection
    await prisma.ussdSession.update({
      where: { id: sessionId },
      data: { stage: "AWAIT_NETWORK", network: null, updatedAt: new Date() },
    });
    return {
      message: "No bundles available.\nChoose Network:\n1. MTN\n2. Telecel\n3. AirtelTigo",
      reply: true,
    };
  }

  const startIdx = page * BUNDLES_PER_PAGE;
  const pageBundles = bundles.slice(startIdx, startIdx + BUNDLES_PER_PAGE);
  const hasMore = bundles.length > startIdx + BUNDLES_PER_PAGE;
  const hasPrev = page > 0;

  let msg = `${networkKey} Bundles:\n`;
  pageBundles.forEach((b, i) => {
    msg += `${i + 1}. ${b.volume} - GHS ${parseFloat(b.price.toString()).toFixed(2)}\n`;
  });

  if (hasPrev) msg += "0. Previous\n";
  if (hasMore) msg += "9. More\n";

  return { message: msg.trim(), reply: true };
}
