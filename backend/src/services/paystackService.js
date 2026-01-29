import crypto from "crypto";
import { AppError } from "../middlewares/errorHandler.js";
import { logger } from "../utils/logger.js";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = "https://api.paystack.co";

/**
 * Get Paystack secret key
 */
const getSecretKey = () => {
  if (!PAYSTACK_SECRET_KEY) {
    throw new AppError(
      "PAYSTACK_SECRET_KEY is not set in environment variables",
      500,
    );
  }
  return PAYSTACK_SECRET_KEY;
};

/**
 * Initialize Paystack transaction
 */
export const initializeTransaction = async (transactionData) => {
  const {
    email,
    amount,
    reference,
    callbackUrl,
    metadata = {},
    currency = "GHS",
  } = transactionData;

  try {
    // Amount should be in pesewas (kobo for NGN) - multiply by 100
    const amountInPesewas = Math.round(parseFloat(amount) * 100);

    const payload = {
      email,
      amount: amountInPesewas,
      reference,
      currency,
      callback_url: callbackUrl,
      metadata: {
        ...metadata,
        cancel_action: callbackUrl,
      },
      channels: ["card", "mobile_money", "bank_transfer", "ussd"],
    };

    logger.info("Initializing Paystack transaction", { reference, amount });

    const response = await fetch(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getSecretKey()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    const data = await response.json();

    if (!response.ok || !data.status) {
      logger.error("Paystack initialization failed", data);
      throw new AppError(
        data.message || "Failed to initialize payment",
        response.status,
      );
    }

    logger.success("Paystack transaction initialized", {
      reference,
      accessCode: data.data.access_code,
    });

    return {
      success: true,
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference: data.data.reference,
    };
  } catch (error) {
    logger.error("Error initializing Paystack transaction", error);
    throw error instanceof AppError
      ? error
      : new AppError("Payment initialization failed", 500);
  }
};

/**
 * Verify Paystack transaction
 */
export const verifyTransaction = async (reference) => {
  try {
    logger.info("Verifying Paystack transaction", { reference });

    const response = await fetch(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${getSecretKey()}`,
        },
      },
    );

    const data = await response.json();

    if (!response.ok || !data.status) {
      logger.error("Paystack verification failed", data);
      throw new AppError(
        data.message || "Failed to verify payment",
        response.status,
      );
    }

    const transaction = data.data;

    // Convert amount back from pesewas to cedis
    const amountInCedis = transaction.amount / 100;

    logger.success("Paystack transaction verified", {
      reference,
      status: transaction.status,
      amount: amountInCedis,
    });

    return {
      success: transaction.status === "success",
      reference: transaction.reference,
      amount: amountInCedis,
      paidAt: transaction.paid_at,
      channel: transaction.channel,
      currency: transaction.currency,
      customerEmail: transaction.customer?.email,
      status: transaction.status,
      gatewayResponse: transaction.gateway_response,
      metadata: transaction.metadata,
    };
  } catch (error) {
    logger.error("Error verifying Paystack transaction", error);
    throw error instanceof AppError
      ? error
      : new AppError("Payment verification failed", 500);
  }
};

/**
 * Verify Paystack webhook signature
 */
export const verifyWebhookSignature = (payload, signature) => {
  try {
    const hash = crypto
      .createHmac("sha512", getSecretKey())
      .update(JSON.stringify(payload))
      .digest("hex");

    return hash === signature;
  } catch (error) {
    logger.error("Error verifying webhook signature", error);
    return false;
  }
};

/**
 * Parse webhook event
 */
export const parseWebhookEvent = (payload) => {
  const { event, data } = payload;

  // Convert amount from pesewas to cedis
  if (data.amount) {
    data.amount = data.amount / 100;
  }

  return {
    event,
    reference: data.reference,
    status: data.status,
    amount: data.amount,
    currency: data.currency,
    paidAt: data.paid_at,
    channel: data.channel,
    customerEmail: data.customer?.email,
    metadata: data.metadata,
    rawData: data,
  };
};

/**
 * Get transaction details
 */
export const getTransaction = async (transactionId) => {
  try {
    const response = await fetch(
      `${PAYSTACK_BASE_URL}/transaction/${transactionId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${getSecretKey()}`,
        },
      },
    );

    const data = await response.json();

    if (!response.ok || !data.status) {
      throw new AppError(
        data.message || "Failed to get transaction",
        response.status,
      );
    }

    return data.data;
  } catch (error) {
    logger.error("Error getting Paystack transaction", error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to get transaction details", 500);
  }
};
