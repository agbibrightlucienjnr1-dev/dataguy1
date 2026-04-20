import { AppError } from "../middlewares/errorHandler.js";
import { logger } from "../utils/logger.js";
import axios from "axios";

const BOSSU_BASE_URL = "https://bossudatahub.com/api.php";

/**
 * Get Bossu API key — read at runtime to ensure dotenv has loaded
 */
const getApiKey = () => {
  const apiKey = process.env.BOSSU_API_KEY;
  if (!apiKey) {
    throw new AppError(
      "BOSSU_API_KEY is not set in environment variables",
      500,
    );
  }
  return apiKey;
};

/**
 * Map network names from our DB enums to Bossu format
 */
const mapNetworkToBossu = (network) => {
  const networkMap = {
    MTN: "mtn",
    AIRTELTIGO: "airteltigo",
    TELECEL: "telecel",
    AT: "at",
  };

  const bossuNetwork = networkMap[network];
  if (!bossuNetwork) {
    throw new AppError(`Unsupported network for Bossu: ${network}`, 400);
  }

  return bossuNetwork;
};

/**
 * Convert our volume string (e.g. "1GB", "500MB") into a Bossu package_key
 * Bossu expects lowercase like "1gb", "500mb"
 */
const volumeToPackageKey = (volumeString) => {
  return volumeString.trim().toLowerCase();
};

/**
 * Make a POST request to Bossu API
 */
const bossuRequest = async (payload) => {
  const apiKey = getApiKey();

  logger.info("Bossu API request", {
    action: payload.action,
  });

  try {
    const response = await axios.post(BOSSU_BASE_URL, payload, {
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Application/DataGuyBackend",
      },
      timeout: 15000, // 15 seconds max
    });

    return response.data;
  } catch (error) {
    const status = error.response?.status || 500;
    const data = error.response?.data || {};
    
    logger.error("Bossu API HTTP error", {
      status,
      data,
      message: error.message,
    });
    
    throw new AppError(
      data?.message || `Bossu API error (${error.message})`,
      status,
    );
  }
};

/**
 * Check Bossu wallet balance
 */
export const checkBalance = async () => {
  try {
    const data = await bossuRequest({ action: "balance" });

    logger.info("Bossu balance response", {
      success: data.success,
      data: JSON.stringify(data),
    });

    if (!data.success) {
      throw new AppError(data.message || "Bossu balance check failed", 500);
    }

    return {
      success: true,
      balance: parseFloat(data.data?.balance ?? data.balance ?? "0"),
      currency: "GHS",
    };
  } catch (error) {
    logger.error("Error checking Bossu balance", {
      error: error.message,
    });

    if (error instanceof AppError) throw error;
    throw new AppError("Failed to check Bossu balance", 500);
  }
};

/**
 * Initiate a data transaction via Bossu Data Hub
 *
 * @param {Object} params
 * @param {string} params.phone - Recipient phone number
 * @param {string} params.network - Network enum (MTN, AIRTELTIGO, etc)
 * @param {string} params.volume - Volume string (e.g. "1GB", "500MB")
 * @param {string} params.reference - Our internal order ID
 * @param {string} [params.webhookUrl] - Optional callback URL for status updates
 */
export const initiateDataTransaction = async ({
  phone,
  network,
  volume,
  reference,
  webhookUrl,
}) => {
  try {
    const bossuNetwork = mapNetworkToBossu(network);
    const packageKey = volumeToPackageKey(volume);

    logger.info("Initiating Bossu data transaction", {
      phone,
      network: bossuNetwork,
      packageKey,
      reference,
    });

    const payload = {
      action: "create_order",
      network: bossuNetwork,
      package_key: packageKey,
      recipient_phone: phone,
      external_reference: reference,
    };

    if (webhookUrl) {
      payload.callback_url = webhookUrl;
    }

    const data = await bossuRequest(payload);

    if (!data.success) {
      logger.error("Bossu order creation failed", {
        reference,
        response: data,
      });
      throw new AppError(
        data.message || "Failed to create Bossu order",
        400,
      );
    }

    const orderId = data.data?.order_id || data.order_id;

    logger.success("Bossu data transaction initiated", {
      reference,
      bossuOrderId: orderId,
      response: data,
    });

    return {
      success: true,
      transactionId: orderId,
      reference,
      message: data.message || "Order created successfully",
      rawResponse: data,
    };
  } catch (error) {
    logger.error("Error initiating Bossu data transaction", {
      phone,
      network,
      volume,
      reference,
      error: error.message,
    });

    if (error instanceof AppError) throw error;
    throw new AppError("Failed to initiate Bossu data transaction", 500);
  }
};

/**
 * Check order status via Bossu
 */
export const checkOrderStatus = async (bossuOrderId) => {
  try {
    const data = await bossuRequest({
      action: "order_status",
      order_id: bossuOrderId,
    });

    return {
      success: true,
      status: data.data?.status || data.status,
      data: data.data || data,
    };
  } catch (error) {
    logger.error("Error checking Bossu order status", {
      bossuOrderId,
      error: error.message,
    });
    throw error;
  }
};

/**
 * List available packages for a network
 */
export const listPackages = async (network) => {
  try {
    const bossuNetwork = mapNetworkToBossu(network);
    const data = await bossuRequest({
      action: "packages",
      network: bossuNetwork,
    });

    return {
      success: true,
      packages: data.data || data.packages || [],
    };
  } catch (error) {
    logger.error("Error listing Bossu packages", {
      network,
      error: error.message,
    });
    throw error;
  }
};
