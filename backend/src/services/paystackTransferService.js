import { AppError } from "../middlewares/errorHandler.js";
import { logger } from "../utils/logger.js";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = "https://api.paystack.co";

/**
 * Get Paystack API key
 */
const getApiKey = () => {
  if (!PAYSTACK_SECRET_KEY) {
    throw new AppError("PAYSTACK_SECRET_KEY is not set", 500);
  }
  return PAYSTACK_SECRET_KEY;
};

/**
 * Create a transfer recipient (bank account or mobile money)
 */
export const createTransferRecipient = async (recipientData) => {
  const {
    type,
    name,
    accountNumber,
    bankCode,
    currency = "GHS",
  } = recipientData;

  try {
    logger.info("Creating Paystack transfer recipient", {
      type,
      name,
      accountNumber: accountNumber.slice(-4), // Log only last 4 digits
    });

    const response = await fetch(`${PAYSTACK_BASE_URL}/transferrecipient`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type,
        name,
        account_number: accountNumber,
        bank_code: bankCode,
        currency,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      logger.error("Failed to create transfer recipient", data);
      throw new AppError(
        data.message || "Failed to create transfer recipient",
        response.status,
      );
    }

    logger.success("Transfer recipient created", {
      recipientCode: data.data.recipient_code,
    });

    return {
      success: true,
      recipientCode: data.data.recipient_code,
      recipientData: data.data,
    };
  } catch (error) {
    logger.error("Error creating transfer recipient", error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to create transfer recipient", 500);
  }
};

/**
 * Initiate a transfer
 */
export const initiateTransfer = async (transferData) => {
  const {
    amount,
    recipient,
    reference,
    reason = "Wallet withdrawal",
  } = transferData;

  try {
    // Convert amount to kobo/pesewas (amount * 100)
    const amountInMinorUnit = Math.round(parseFloat(amount) * 100);

    logger.info("Initiating Paystack transfer", {
      amount: amountInMinorUnit,
      recipient,
      reference,
    });

    const response = await fetch(`${PAYSTACK_BASE_URL}/transfer`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "balance",
        amount: amountInMinorUnit,
        recipient,
        reference,
        reason,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      logger.error("Failed to initiate transfer", data);
      throw new AppError(
        data.message || "Failed to initiate transfer",
        response.status,
      );
    }

    logger.success("Transfer initiated", {
      transferCode: data.data.transfer_code,
      reference: data.data.reference,
      status: data.data.status,
    });

    return {
      success: true,
      transferCode: data.data.transfer_code,
      reference: data.data.reference,
      status: data.data.status,
      transferData: data.data,
    };
  } catch (error) {
    logger.error("Error initiating transfer", error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to initiate transfer", 500);
  }
};

/**
 * Verify a transfer
 */
export const verifyTransfer = async (reference) => {
  try {
    logger.info("Verifying transfer", { reference });

    const response = await fetch(
      `${PAYSTACK_BASE_URL}/transfer/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${getApiKey()}`,
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();

    if (!response.ok || !data.status) {
      logger.error("Failed to verify transfer", data);
      throw new AppError(
        data.message || "Failed to verify transfer",
        response.status,
      );
    }

    logger.info("Transfer verified", {
      reference,
      status: data.data.status,
    });

    return {
      success: true,
      status: data.data.status,
      transferData: data.data,
    };
  } catch (error) {
    logger.error("Error verifying transfer", error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to verify transfer", 500);
  }
};

/**
 * Get bank list for Ghana
 */
export const getBankList = async () => {
  try {
    const response = await fetch(
      `${PAYSTACK_BASE_URL}/bank?country=ghana&currency=GHS`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${getApiKey()}`,
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();

    if (!response.ok || !data.status) {
      logger.error("Failed to get bank list", data);
      throw new AppError(
        data.message || "Failed to get bank list",
        response.status,
      );
    }

    return {
      success: true,
      banks: data.data,
    };
  } catch (error) {
    logger.error("Error getting bank list", error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to get bank list", 500);
  }
};

/**
 * Resolve account number
 */
export const resolveAccountNumber = async (accountNumber, bankCode) => {
  try {
    const response = await fetch(
      `${PAYSTACK_BASE_URL}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${getApiKey()}`,
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();

    if (!response.ok || !data.status) {
      logger.error("Failed to resolve account number", data);
      throw new AppError(
        data.message || "Invalid account number or bank",
        response.status,
      );
    }

    return {
      success: true,
      accountName: data.data.account_name,
      accountNumber: data.data.account_number,
    };
  } catch (error) {
    logger.error("Error resolving account number", error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to verify account", 500);
  }
};
