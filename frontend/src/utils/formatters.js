import { format, formatDistanceToNow, parseISO } from "date-fns";

/**
 * Format amount as Ghana Cedis
 * @param {number|string} amount - The amount to format
 * @returns {string} Formatted currency string (e.g., "GH₵50.00")
 */
export const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0;
  return `GH₵${num.toFixed(2)}`;
};

/**
 * Format phone number for display
 * Removes country code if present
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone (e.g., "0241234567")
 */
export const formatPhone = (phone) => {
  if (!phone) return "";
  // Remove +233 country code and replace with 0
  return phone.replace(/^\+233/, "0");
};

/**
 * Format phone for API submission
 * @param {string} phone - Phone number (10 digits starting with 0)
 * @returns {string} Phone with country code (e.g., "+233241234567")
 */
export const formatPhoneForApi = (phone) => {
  if (!phone) return "";
  // If already has country code, return as is
  if (phone.startsWith("+233")) return phone;
  // Remove leading 0 and add country code
  return `+233${phone.replace(/^0/, "")}`;
};

/**
 * Format date as readable string
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date (e.g., "Jan 29, 2026")
 */
export const formatDate = (date) => {
  if (!date) return "";
  const parsed = typeof date === "string" ? parseISO(date) : date;
  return format(parsed, "MMM dd, yyyy");
};

/**
 * Format date with time
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted datetime (e.g., "Jan 29, 2026 12:30 PM")
 */
export const formatDateTime = (date) => {
  if (!date) return "";
  const parsed = typeof date === "string" ? parseISO(date) : date;
  return format(parsed, "MMM dd, yyyy h:mm a");
};

/**
 * Format date as relative time
 * @param {string|Date} date - Date to format
 * @returns {string} Relative time (e.g., "5 minutes ago")
 */
export const formatRelative = (date) => {
  if (!date) return "";
  const parsed = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(parsed, { addSuffix: true });
};

/**
 * Format volume for display
 * @param {string} volume - Volume string from API
 * @returns {string} Formatted volume
 */
export const formatVolume = (volume) => {
  return volume || "";
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncate = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Format order ID for display (show first 8 characters)
 * @param {string} id - Full order ID
 * @returns {string} Shortened ID
 */
export const formatOrderId = (id) => {
  if (!id) return "";
  return id.length > 8 ? `${id.substring(0, 8)}...` : id;
};

/**
 * Get initials from name
 * @param {string} name - Full name
 * @returns {string} Initials (e.g., "JD" for "John Doe")
 */
export const getInitials = (name) => {
  if (!name) return "";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};
