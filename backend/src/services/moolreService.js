import { AppError } from "../middlewares/errorHandler.js";
import { logger } from "../utils/logger.js";

const MOOLRE_API_URL = "https://api.moolre.com/open/transact";

const getMoolreConfig = () => {
  const username = process.env.MOOLRE_USERNAME;
  const publicKey = process.env.MOOLRE_PUBLIC_KEY;
  const privateKey = process.env.MOOLRE_API_KEY || process.env.MOOLRE_PUBLIC_KEY; // Fallback for now if not set
  const accountNumber = process.env.MOOLRE_ACCOUNT_NUMBER;

  if (!username || !publicKey || !accountNumber) {
    throw new AppError("Moolre configuration is missing in environment variables", 500);
  }

  return { username, publicKey, privateKey, accountNumber };
};

const getNetworkCode = (network) => {
  const map = {
    "MTN": "13",
    "TELECEL": "6",
    "VODAFONE": "6",
    "AT": "7",
    "AIRTELTIGO": "7",
  };
  return map[network?.toUpperCase()] || "";
};

const getTransferNetworkCode = (network) => {
  const map = {
    "MTN": "1", // MTN implies 1 for Transfers
    "TELECEL": "6",
    "VODAFONE": "6",
    "AT": "7",
    "AIRTELTIGO": "7",
  };
  return map[network?.toUpperCase()] || "";
};

/**
 * Initiate Moolre Payment
 * - If response code is TP14: OTP was sent to customer, show OTP step.
 * - Otherwise: Payment prompt sent directly to customer's phone — no OTP needed.
 */
export const initiateMoolrePayment = async ({ amount, phone, network, reference }) => {
  const { username, publicKey, accountNumber } = getMoolreConfig();

  const payload = {
    type: 1,
    channel: getNetworkCode(network),
    currency: "GHS",
    payer: phone,
    amount: amount.toString(),
    externalref: reference,
    accountnumber: accountNumber,
    reference: "DataGuy Purchase"
  };

  logger.info("Initializing Moolre transaction", { reference, phone, network });

  try {
    const response = await fetch(`${MOOLRE_API_URL}/payment`, {
      method: "POST",
      headers: {
        "X-API-USER": username,
        "X-API-PUBKEY": publicKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || data.status !== 1) {
      logger.error("Moolre initialization failed", data);
      throw new AppError(data.message || "Failed to initialize Moolre payment", response.status || 400);
    }

    // Code TP14 means OTP was sent. Any other success code means payment prompt was sent directly.
    const responseCode = data.code || data.responsecode || "";
    const otpRequired = responseCode === "TP14";

    logger.info("Moolre initiation response", { responseCode, otpRequired, message: data.message });

    return {
      success: true,
      otpRequired,
      message: data.message,
      reference
    };
  } catch (error) {
    logger.error("Error initializing Moolre payment", error);
    throw error instanceof AppError ? error : new AppError("Payment initialization failed", 500);
  }
};

/**
 * Submit Moolre OTP and Trigger Payment Prompt
 */
export const submitMoolreOtp = async ({ amount, phone, network, reference, otpcode }) => {
  const { username, publicKey, accountNumber } = getMoolreConfig();

  const basePayload = {
    type: 1,
    channel: getNetworkCode(network),
    currency: "GHS",
    payer: phone,
    amount: amount.toString(),
    externalref: reference,
    accountnumber: accountNumber,
    reference: "DataGuy Purchase"
  };

  logger.info("Submitting Moolre OTP", { reference });

  try {
    // Step 1: Verify OTP
    const otpPayload = { ...basePayload, otpcode };
    const otpResponse = await fetch(`${MOOLRE_API_URL}/payment`, {
      method: "POST",
      headers: {
        "X-API-USER": username,
        "X-API-PUBKEY": publicKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(otpPayload),
    });

    const otpData = await otpResponse.json();

    if (!otpResponse.ok || otpData.status !== 1) {
      logger.error("Moolre OTP verification failed", otpData);
      throw new AppError(otpData.message || "Invalid OTP code", otpResponse.status || 400);
    }

    // Step 2: Trigger Payment Prompt (Resend without OTP)
    logger.info("Triggering Moolre Payment Prompt", { reference });
    const promptResponse = await fetch(`${MOOLRE_API_URL}/payment`, {
      method: "POST",
      headers: {
        "X-API-USER": username,
        "X-API-PUBKEY": publicKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(basePayload), // base without OTP
    });

    const promptData = await promptResponse.json();

    if (!promptResponse.ok || promptData.status !== 1) {
      logger.error("Moolre Prompt Trigger failed", promptData);
      throw new AppError(promptData.message || "Failed to trigger payment prompt", promptResponse.status || 400);
    }

    return {
      success: true,
      message: "Please check your phone and enter your Mobile Money PIN."
    };
  } catch (error) {
    logger.error("Error in Moolre OTP flow", error);
    throw error instanceof AppError ? error : new AppError("Failed to process payment OTP", 500);
  }
};

/**
 * Verify Moolre Transaction Status
 */
export const verifyMoolreTransaction = async (reference) => {
  const { username, publicKey, accountNumber } = getMoolreConfig();

  logger.info("Verifying Moolre transaction status", { reference });

  try {
    const response = await fetch(`${MOOLRE_API_URL}/status`, {
      method: "POST",
      headers: {
        "X-API-USER": username,
        "X-API-PUBKEY": publicKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: 1,
        idtype: 1, // 1 = externalref
        id: reference,
        accountnumber: accountNumber
      }),
    });

    const data = await response.json();

    logger.info("Moolre status API raw response", {
      reference,
      httpStatus: response.status,
      responseStatus: data.status,
      responseCode: data.code,
      txstatus: data.data?.txstatus,
      amount: data.data?.amount,
      fullData: JSON.stringify(data.data || {})
    });

    if (!response.ok || data.status !== 1) {
      logger.error("Moolre status check failed", data);
      throw new AppError(data.message || "Failed to verify transaction status", response.status || 400);
    }

    // txstatus: 1=Successful, 0=Pending, 2=Failed
    const txstatus = data.data?.txstatus;
    
    // Parse amount — Moolre may return as string in GHS
    let rawAmount = data.data?.amount;
    let paidAmount = rawAmount !== undefined && rawAmount !== null ? parseFloat(rawAmount) : null;
    
    logger.info("Moolre transaction status parsed", { reference, txstatus, rawAmount, paidAmount });
    
    return {
      success: txstatus === 1,
      status: txstatus === 1 ? "success" : txstatus === 2 ? "failed" : "pending",
      amount: paidAmount,  // null if not returned by API
      data: data.data
    };
  } catch (error) {
    logger.error("Error verifying Moolre transaction", error);
    throw error instanceof AppError ? error : new AppError("Transaction verification failed", 500);
  }
};

/**
 * Validate Account Name
 */
export const validateAccountName = async ({ network, accountNumber }) => {
  const { username, privateKey, accountNumber: moolreAccount } = getMoolreConfig();

  logger.info("Validating Moolre account name", { network, accountNumber });

  try {
    const response = await fetch(`${MOOLRE_API_URL}/validate`, {
      method: "POST",
      headers: {
        "X-API-USER": username,
        "X-API-KEY": privateKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: 1,
        channel: getTransferNetworkCode(network),
        currency: "GHS",
        receiver: accountNumber,
        accountnumber: moolreAccount,
      }),
    });

    const data = await response.json();

    if (!response.ok || data.status !== 1) {
      logger.error("Moolre account name validation failed", data);
      throw new AppError(data.message || "Failed to validate account name", response.status || 400);
    }

    return {
      success: true,
      data: {
        accountName: data.data,
      },
      message: data.message,
    };
  } catch (error) {
    logger.error("Error validating Moolre account name", error);
    throw error instanceof AppError ? error : new AppError("Account validation failed", 500);
  }
};

/**
 * Initiate Moolre Transfer
 */
export const initiateMoolreTransfer = async ({ amount, network, accountNumber, reference, reason }) => {
  const { username, privateKey, accountNumber: moolreAccount } = getMoolreConfig();

  const payload = {
    type: 1,
    channel: getTransferNetworkCode(network),
    currency: "GHS",
    amount: amount.toString(),
    receiver: accountNumber,
    externalref: reference,
    reference: reason || "DataGuy Withdrawal",
    accountnumber: moolreAccount,
  };

  logger.info("Initializing Moolre transfer", { reference, accountNumber, network, amount });

  try {
    const response = await fetch(`${MOOLRE_API_URL}/transfer`, {
      method: "POST",
      headers: {
        "X-API-USER": username,
        "X-API-KEY": privateKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error("Moolre transfer initialization failed (HTTP error)", data);
      throw new AppError(data.message || "Failed to initiate Moolre transfer", response.status || 400);
    }

    const txstatus = data.data?.txstatus;
    const isFailed = data.status === "0" || txstatus === 2 || (data.status !== 1 && data.status !== "1");

    // Do not assume failure unless explicitly failed
    if (isFailed && data.code !== "OBGH01") {
       logger.error("Moolre transfer initiation returned failure", data);
       throw new AppError(data.message?.[0] || data.message || "Transfer failed", 400);
    }
    
    logger.info("Moolre transfer initiation response", { reference, txstatus, code: data.code });

    return {
      success: true,
      status: txstatus === 1 ? "success" : txstatus === 2 ? "failed" : "pending",
      data: data.data,
      message: data.message,
      transferCode: data.data?.transactionid,
    };
  } catch (error) {
    logger.error("Error initializing Moolre transfer", error);
    throw error instanceof AppError ? error : new AppError("Transfer initialization failed", 500);
  }
};

