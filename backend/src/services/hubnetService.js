import { AppError } from "../middlewares/errorHandler.js";
import { logger } from "../utils/logger.js";

/**
 * Get Hubnet API key - read at runtime to ensure dotenv has loaded
 */
const getApiKey = () => {
  const apiKey = process.env.HUBNET_API_KEY;
  if (!apiKey) {
    throw new AppError(
      "HUBNET_API_KEY is not set in environment variables",
      500,
    );
  }
  return apiKey;
};

/**
 * Get Hubnet base URL - read at runtime
 */
const getBaseUrl = () => {
  const baseUrl = process.env.HUBNET_BASE_URL;
  if (!baseUrl) {
    throw new AppError(
      "HUBNET_BASE_URL is not set in environment variables",
      500,
    );
  }
  return baseUrl;
};

/**
 * Map network names to Hubnet format
 */
const mapNetworkToHubnet = (network) => {
  const networkMap = {
    MTN: "mtn",
    AIRTELTIGO: "big-time",
    AT: "at",
    TELECEL: "telecel",
  };

  const hubnetNetwork = networkMap[network];
  if (!hubnetNetwork) {
    throw new AppError(`Unsupported network: ${network}`, 400);
  }

  return hubnetNetwork;
};

/**
 * Extract volume number from bundle volume string
 * E.g., "1GB" -> 1000, "500MB" -> 500, "2GB" -> 2000
 * Note: Hubnet uses decimal (1GB = 1000MB), not binary (1024MB)
 */
const extractVolumeInMB = (volumeString) => {
  const match = volumeString.match(/^(\d+(?:\.\d+)?)\s*(GB|MB)$/i);

  if (!match) {
    throw new AppError(`Invalid volume format: ${volumeString}`, 400);
  }

  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();

  if (unit === "GB") {
    return Math.round(value * 1000); // Convert GB to MB (decimal: 1GB = 1000MB)
  } else {
    return Math.round(value);
  }
};

/**
 * Check Hubnet wallet balance
 */
export const checkBalance = async () => {
  try {
    const baseUrl = getBaseUrl();
    logger.info("Checking Hubnet wallet balance", { baseUrl });

    const response = await fetch(`${baseUrl}/check_balance`, {
      method: "GET",
      headers: {
        token: `Bearer ${getApiKey()}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    // Balance is nested in data.data.wallet_balance based on actual API response
    const walletBalance = data.data?.wallet_balance;

    logger.info("Hubnet balance API response", {
      status: data.status,
      balance: walletBalance,
      rawData: JSON.stringify(data),
    });

    if (!response.ok || data.status !== "success") {
      logger.error("Hubnet balance check failed", data);
      throw new AppError(
        data.message || "Failed to check Hubnet balance",
        response.status,
      );
    }

    logger.success("Hubnet balance retrieved", { balance: walletBalance });

    return {
      success: true,
      balance: walletBalance,
      currency: "GHS",
      data: data,
    };
  } catch (error) {
    logger.error("Error checking Hubnet balance", error);

    // Provide more helpful error messages for network/DNS errors
    if (
      error.cause?.code === "ENOTFOUND" ||
      error.message?.includes("getaddrinfo ENOTFOUND")
    ) {
      const baseUrl = getBaseUrl();
      throw new AppError(
        `Cannot reach Hubnet API at ${baseUrl}. Please verify HUBNET_BASE_URL is set correctly. Expected: https://console.hubnet.app/live/api/context/business/transaction`,
        500,
      );
    }

    throw error instanceof AppError
      ? error
      : new AppError("Failed to check Hubnet balance", 500);
  }
};

/**
 * Initiate Hubnet data transaction
 */
export const initiateDataTransaction = async (transactionData) => {
  const { phone, network, volume, reference, referrer, webhookUrl } =
    transactionData;

  try {
    // Map network to Hubnet format
    const hubnetNetwork = mapNetworkToHubnet(network);

    // Extract volume in MB
    const volumeInMB = extractVolumeInMB(volume);

    // Format phone number (ensure it's 10 digits, remove any spaces/dashes)
    const formattedPhone = phone.replace(/[\s-]/g, "");
    if (formattedPhone.length !== 10 || !formattedPhone.startsWith("0")) {
      throw new AppError(
        "Phone number must be 10 digits in national format (e.g., 0241234567)",
        400,
      );
    }

    const payload = {
      phone: formattedPhone,
      volume: volumeInMB.toString(),
      reference: reference.substring(0, 23),
    };

    // Add optional fields
    if (referrer) {
      const formattedReferrer = referrer.replace(/[\s-]/g, "");
      if (
        formattedReferrer.length === 10 &&
        formattedReferrer.startsWith("0")
      ) {
        payload.referrer = formattedReferrer;
      }
    }

    if (webhookUrl) {
      payload.webhook = webhookUrl;
    }

    logger.info("Initiating Hubnet data transaction", {
      network: hubnetNetwork,
      phone: formattedPhone,
      volume: `${volumeInMB}MB`,
      reference,
    });

    const baseUrl = getBaseUrl();
    const endpoint = `${baseUrl}/${hubnetNetwork}-new-transaction`;

    logger.info("Hubnet API endpoint", { endpoint, baseUrl });

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        token: `Bearer ${getApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    // Log the FULL response to debug field mapping
    logger.info("Hubnet API FULL response", {
      httpStatus: response.status,
      rawResponse: JSON.stringify(data),
    });

    if (!response.ok || !data.status) {
      logger.error("Hubnet transaction failed", {
        code: data.code,
        message: data.message,
        reason: data.reason,
      });

      // Handle specific error codes
      if (data.code === "1001") {
        throw new AppError("Invalid network", 400);
      } else if (data.code === "1002") {
        throw new AppError("Invalid data volume", 400);
      } else {
        throw new AppError(
          data.message ||
            data.reason ||
            "Failed to initiate Hubnet transaction",
          response.status,
        );
      }
    }

    logger.success("Hubnet transaction initiated", {
      transactionId: data.transaction_id,
      paymentId: data.payment_id,
      reference: data.reference,
    });

    return {
      success: true,
      transactionId: data.transaction_id,
      paymentId: data.payment_id,
      reference: data.reference,
      status: data.data?.status,
      message: data.data?.message || data.message,
      code: data.code,
      ipAddress: data.ip_address,
      rawResponse: data,
    };
  } catch (error) {
    logger.error("Error initiating Hubnet transaction", error);

    // Provide more helpful error messages for network/DNS errors
    if (
      error.cause?.code === "ENOTFOUND" ||
      error.message?.includes("getaddrinfo ENOTFOUND")
    ) {
      const baseUrl = getBaseUrl();
      throw new AppError(
        `Cannot reach Hubnet API at ${baseUrl}. Please verify HUBNET_BASE_URL is set correctly. Expected: https://console.hubnet.app/live/api/context/business/transaction`,
        500,
      );
    }

    throw error instanceof AppError
      ? error
      : new AppError("Failed to initiate data transaction", 500);
  }
};

/**
 * Get transaction status (if Hubnet provides this endpoint)
 */
export const getTransactionStatus = async (transactionId) => {
  try {
    logger.info("Checking Hubnet transaction status", { transactionId });

    // Note: This endpoint might not exist in Hubnet API
    // Keeping it here for future use if they add it
    const response = await fetch(
      `${getBaseUrl()}/transaction/${transactionId}`,
      {
        method: "GET",
        headers: {
          token: `Bearer ${getApiKey()}`,
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();

    if (!response.ok || !data.status) {
      throw new AppError(
        data.message || "Failed to get transaction status",
        response.status,
      );
    }

    return data;
  } catch (error) {
    logger.error("Error getting Hubnet transaction status", error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to get transaction status", 500);
  }
};
