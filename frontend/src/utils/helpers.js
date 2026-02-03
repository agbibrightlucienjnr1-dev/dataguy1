import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with clsx
 * @param  {...any} inputs - Class names to merge
 * @returns {string} Merged class string
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("Failed to copy:", err);
    return false;
  }
}

/**
 * Generate a random ID
 * @param {number} length - Length of the ID
 * @returns {string} Random ID
 */
export function generateId(length = 8) {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
}

/**
 * Debounce a function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Check if user has a specific role
 * @param {Object} user - User object
 * @param {string|string[]} roles - Role(s) to check
 * @returns {boolean} Whether user has role
 */
export function hasRole(user, roles) {
  if (!user?.role) return false;
  const roleArray = Array.isArray(roles) ? roles : [roles];
  return roleArray.includes(user.role);
}

/**
 * Get status badge props based on status
 * @param {Object} statusMap - Map of status to props
 * @param {string} status - Current status
 * @returns {Object} Status props
 */
export function getStatusProps(statusMap, status) {
  return (
    statusMap[status] || { label: status, color: "bg-gray-100 text-gray-800" }
  );
}

/**
 * Build query string from params object
 * @param {Object} params - Parameters object
 * @returns {string} Query string
 */
export function buildQueryString(params) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, value);
    }
  });
  return searchParams.toString();
}

/**
 * Parse query string to object
 * @param {string} queryString - Query string
 * @returns {Object} Parsed params
 */
export function parseQueryString(queryString) {
  const params = new URLSearchParams(queryString);
  const result = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

/**
 * Sleep for specified duration
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get user-friendly error message from API error
 * Maps technical error messages to user-friendly ones
 * @param {Object|string} error - Error object or message
 * @param {string} fallback - Fallback message if error cannot be parsed
 * @returns {string} User-friendly error message
 */
export function getErrorMessage(
  error,
  fallback = "Something went wrong. Please try again.",
) {
  // Extract message from error object
  const rawMessage =
    typeof error === "string"
      ? error
      : error?.message || error?.response?.data?.message || fallback;

  // Map of technical messages to user-friendly messages
  const errorMap = {
    // Authentication errors
    "Invalid credentials":
      "The phone number or password you entered is incorrect. Please check your credentials and try again.",
    "Invalid phone or password":
      "The phone number or password you entered is incorrect. Please check your credentials and try again.",
    "The phone number or password you entered is incorrect":
      "The phone number or password you entered is incorrect. Please check your credentials and try again.",
    "User not found": 
      "The phone number or password you entered is incorrect. Please check your credentials and try again.",
    "Email already exists": 
      "An account with this email address already exists. Please use a different email or try logging in instead.",
    "An account with this email address already exists":
      "An account with this email address already exists. Please use a different email or try logging in instead.",
    "Phone already exists": 
      "An account with this phone number already exists. Please use a different phone number or try logging in instead.",
    "An account with this phone number already exists":
      "An account with this phone number already exists. Please use a different phone number or try logging in instead.",
    "Invalid referral code":
      "The referral code you entered is invalid or has expired. Please check the code and try again, or contact the agent who provided it.",
    "The referral code you entered is invalid":
      "The referral code you entered is invalid or has expired. Please check the code and try again, or contact the agent who provided it.",
    "Referral code required for sub-agent registration":
      "A referral code is required to register as a sub-agent. Please use the registration link provided by your agent.",
    "Invalid token": "Your session has expired. Please log in again.",
    "Token expired": "Your session has expired. Please log in again.",
    "Not authenticated": "Please log in to continue.",
    "Not authorized": "You don't have permission to perform this action.",
    "Please fill in all required fields":
      "Please fill in all required fields: name, email, phone number, and password.",
    "Please enter both your phone number and password":
      "Please enter both your phone number and password to sign in.",

    // Payment/Order errors
    "Payment not verified":
      "Payment verification failed. Please check your payment status or try again.",
    "Order not found": "We couldn't find this order. It may have been deleted.",
    "Bundle not found": "This data bundle is no longer available.",
    "Insufficient balance":
      "You don't have enough balance for this transaction.",
    "Payment already processed": "This payment has already been processed.",

    // Withdrawal errors
    "Withdrawal not found": "This withdrawal request could not be found.",
    "Insufficient wallet balance":
      "You don't have enough balance to withdraw this amount.",
    "Minimum withdrawal amount": "The minimum withdrawal amount is GHS 10.",
    "Invalid account number": "Please check your account number and try again.",
    "Failed to initiate transfer":
      "We couldn't process the transfer. Please try again later.",

    // Network/Server errors
    "Network Error":
      "Unable to connect. Please check your internet connection.",
    "timeout of": "The request timed out. Please try again.",
    ECONNREFUSED: "Server is currently unavailable. Please try again later.",
    500: "Something went wrong on our end. Please try again later.",
    503: "Service temporarily unavailable. Please try again in a few minutes.",

    // Hubnet errors
    "HUBNET_API_KEY is not set":
      "Data service is not configured. Please contact support.",
    "Failed to send data bundle":
      "Could not deliver data bundle. Please try again or contact support.",

    // Validation errors
    "Validation failed": "Please check your input and try again.",
    "Invalid phone number":
      "Please enter a valid Ghana phone number (e.g., 0241234567).",
    "Invalid email": "Please enter a valid email address.",
  };

  // Handle password validation errors with better formatting
  if (rawMessage.includes("Your password") || rawMessage.includes("Password")) {
    // Check if it's a multi-line password error (from backend)
    if (rawMessage.includes("\n•")) {
      return rawMessage; // Return formatted password requirements as-is
    }
    // Check if it's a single password error
    if (rawMessage.includes("must be at least") || 
        rawMessage.includes("must contain")) {
      return rawMessage; // Return password requirements as-is
    }
  }

  // Check for exact matches
  if (errorMap[rawMessage]) {
    return errorMap[rawMessage];
  }

  // Check for partial matches
  for (const [key, value] of Object.entries(errorMap)) {
    if (rawMessage.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  // If the message is already user-friendly (not too technical), return it
  if (
    rawMessage &&
    !rawMessage.includes("Error:") &&
    !rawMessage.includes("error:") &&
    rawMessage.length < 150
  ) {
    return rawMessage;
  }

  return fallback;
}
