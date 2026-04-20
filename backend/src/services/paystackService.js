import crypto from "crypto";
import { AppError } from "../middlewares/errorHandler.js";
import { logger } from "../utils/logger.js";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

/**
 * Get Paystack secret key
 */
const getSecretKey = () => {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new AppError(
      "PAYSTACK_SECRET_KEY is not set in environment variables",
      500,
    );
  }
  return secretKey;
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

    // Log full response for debugging
    logger.info("Paystack verification response", {
      reference,
      httpStatus: response.status,
      status: data.status,
      message: data.message,
    });

    // If transaction not found or API error, return failure (don't throw)
    if (!response.ok || !data.status) {
      logger.warn("Paystack verification returned non-success", {
        reference,
        httpStatus: response.status,
        message: data.message,
      });
      return {
        success: false,
        reference,
        status: "not_found",
        message: data.message || "Transaction not found or verification failed",
      };
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
    logger.error("Error verifying Paystack transaction", {
      reference,
      error: error.message,
    });
    // Return failure instead of throwing - allows graceful handling
    return {
      success: false,
      reference,
      status: "error",
      message: error.message || "Payment verification failed",
    };
  }
};

/**
 * Verify Paystack webhook signature
 * @param {Object} payload - Parsed JSON body (fallback)
 * @param {string} signature - x-paystack-signature header
 * @param {Buffer} [rawBody] - Raw request body buffer (preferred for accurate HMAC)
 */
export const verifyWebhookSignature = (payload, signature, rawBody) => {
  try {
    // Use raw body if available (exact bytes Paystack signed), else fall back to re-stringified JSON
    const body = rawBody || JSON.stringify(payload);
    const hash = crypto
      .createHmac("sha512", getSecretKey())
      .update(body)
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

/**
 * Charge a customer directly via mobile money (Ghana).
 * Paystack sends a MoMo PIN prompt to the customer's phone.
 * Use this for USSD flows where redirecting to a URL is not possible.
 *
 * @param {Object} params
 * @param {string|number} params.amount  - Amount in GHS (will be converted to pesewas)
 * @param {string} params.phone          - Customer phone in local format (0XXXXXXXXX)
 * @param {string} params.network        - Network key: "MTN" | "TELECEL" | "AT" | "AIRTELTIGO"
 * @param {string} params.reference      - Unique reference (orderId)
 * @param {string} params.email          - Customer email (required by Paystack)
 */
export const chargeViaMobileMoney = async ({
  amount,
  phone,
  network,
  reference,
  email,
}) => {
  // Paystack mobile_money provider codes for GHS
  const NETWORK_TO_PROVIDER = {
    MTN: "mtn",
    TELECEL: "vod",
    VODAFONE: "vod",
    AT: "tgo",
    AIRTELTIGO: "tgo",
  };

  const provider = NETWORK_TO_PROVIDER[network?.toUpperCase()];
  if (!provider) {
    throw new AppError(
      `Unsupported network for mobile money charge: ${network}`,
      400,
    );
  }

  // Paystack expects amount in the lowest currency unit (pesewas)
  const amountInPesewas = Math.round(parseFloat(amount.toString()) * 100);

  const payload = {
    email,
    amount: amountInPesewas,
    currency: "GHS",
    reference,
    mobile_money: {
      phone, // local format: 0241234567
      provider,
    },
  };

  logger.info("Initiating Paystack mobile money charge", {
    reference,
    phone,
    network,
    provider,
    amountInPesewas,
  });

  try {
    const response = await fetch(`${PAYSTACK_BASE_URL}/charge`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getSecretKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    logger.info("Paystack charge response", {
      reference,
      httpStatus: response.status,
      status: data.data?.status,
      message: data.message,
    });

    if (!response.ok || !data.status) {
      throw new AppError(
        data.message || "Failed to initiate mobile money charge",
        response.status || 400,
      );
    }

    const chargeStatus = data.data?.status;

    if (chargeStatus === "failed") {
      throw new AppError(
        data.data?.display_text || data.message || "Mobile money charge failed",
        400,
      );
    }

    // "pay_offline" = prompt sent to phone ✓
    // "send_otp" / "send_pin" = awaiting customer verification via SMS PIN ✓
    return {
      success: true,
      status: chargeStatus,
      reference,
      displayText: data.data?.display_text || data.message || "Please complete authorization.",
    };
  } catch (error) {
    logger.error("Error initiating Paystack mobile money charge", {
      reference,
      error: error.message,
    });
    throw error instanceof AppError
      ? error
      : new AppError("Mobile money charge failed", 500);
  }
};

/**
 * Submit an SMS OTP or voucher code required by Paystack for mobile money charges that return 'send_otp'
 * @param {string} reference - The transaction reference (order id)
 * @param {string} otp       - The one-time PIN or voucher code entered by the user
 */
export const submitPaystackOTP = async (reference, otp) => {
  logger.info("Submitting Paystack OTP", { reference });

  try {
    const response = await fetch(`${PAYSTACK_BASE_URL}/charge/submit_otp`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getSecretKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reference, otp }),
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      throw new AppError(
        data.message || "Failed to submit Paystack OTP",
        response.status || 400,
      );
    }

    return {
      success: true,
      status: data.data?.status || (data.status ? "success" : "failed"),
      message: data.data?.display_text || data.message,
    };
  } catch (error) {
    logger.error("Error submitting Paystack OTP", { reference, error: error.message });
    throw error instanceof AppError ? error : new AppError("OTP submission failed", 500);
  }
};
