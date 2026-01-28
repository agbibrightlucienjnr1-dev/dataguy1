/**
 * Common validation utilities
 */

export const validatePhone = (phone) => {
  // Ghana phone number format (10 digits starting with 0)
  const phoneRegex = /^0\d{9}$/;
  return phoneRegex.test(phone);
};

export const validateAmount = (amount) => {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const sanitizePhone = (phone) => {
  // Remove spaces, dashes, and ensure proper format
  return phone.replace(/[\s-]/g, "");
};

export const formatMoney = (amount) => {
  // Format money in Ghana cedis (GH₵)
  return `GH₵ ${parseFloat(amount).toFixed(2)}`;
};
