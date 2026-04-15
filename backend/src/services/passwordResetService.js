import { getPrisma } from "../config/database.js";
import { hashPassword, validatePasswordStrength } from "../utils/password.js";
import { sendSMS } from "./smsService.js";
import { AppError } from "../middlewares/errorHandler.js";
import bcrypt from "bcrypt";

/**
 * Generate a 4-digit numeric code
 * @returns {string} - 4-digit code
 */
const generateResetCode = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

/**
 * Hash a reset code for storage
 * @param {string} code - Plain text code
 * @returns {Promise<string>} - Hashed code
 */
const hashResetCode = async (code) => {
  return await bcrypt.hash(code, 10);
};

/**
 * Verify a reset code against its hash
 * @param {string} code - Plain text code
 * @param {string} hash - Hashed code
 * @returns {Promise<boolean>} - True if codes match
 */
const verifyResetCode = async (code, hash) => {
  return await bcrypt.compare(code, hash);
};

/**
 * Normalize phone number (remove +233 prefix, ensure starts with 0)
 * @param {string} phone - Phone number
 * @returns {string} - Normalized phone number
 */
const normalizePhone = (phone) => {
  return phone.trim().replace(/^\+233/, "0");
};

/**
 * Request password reset for a phone number
 * @param {string} phone - Phone number
 * @returns {Promise<Object>} - Success message
 */
export const requestPasswordReset = async (phone) => {
  const prisma = getPrisma();
  const normalizedPhone = normalizePhone(phone);

  // Validate phone format
  if (!/^0\d{9}$/.test(normalizedPhone)) {
    throw new AppError("Please enter a valid Ghana phone number (e.g., 0241234567)", 400);
  }

  // Check if user exists (but don't reveal this in response for security)
  const user = await prisma.user.findFirst({
    where: { phone: normalizedPhone },
  });

  // Generate reset code
  const resetCode = generateResetCode();
  const tokenHash = await hashResetCode(resetCode);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Create reset token record
  await prisma.passwordResetToken.create({
    data: {
      phone: normalizedPhone,
      tokenHash,
      expiresAt,
    },
  });

  // Send SMS with reset code
  const message = `Your DataGuy password reset code is: ${resetCode}. This code expires in 15 minutes.`;
  const smsResult = await sendSMS([normalizedPhone], message);

  if (!smsResult.success) {
    throw new AppError("Failed to send reset code. Please try again later.", 500);
  }

  return {
    success: true,
    message: "If an account with this phone number exists, a reset code has been sent.",
  };
};

/**
 * Verify a password reset code
 * @param {string} phone - Phone number
 * @param {string} code - Reset code
 * @returns {Promise<Object>} - Verification result
 */
export const verifyPasswordResetCode = async (phone, code) => {
  const prisma = getPrisma();
  const normalizedPhone = normalizePhone(phone);

  // Find the latest unused token for this phone
  const token = await prisma.passwordResetToken.findFirst({
    where: {
      phone: normalizedPhone,
      used: false,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!token) {
    throw new AppError("Invalid or expired reset code", 400);
  }

  // Verify the code
  const isValid = await verifyResetCode(code, token.tokenHash);
  if (!isValid) {
    throw new AppError("Invalid reset code", 400);
  }

  // Mark token as used
  await prisma.passwordResetToken.update({
    where: { id: token.id },
    data: {
      used: true,
      usedAt: new Date(),
    },
  });

  return {
    success: true,
    message: "Code verified successfully",
  };
};

/**
 * Reset password using verified code
 * @param {string} phone - Phone number
 * @param {string} code - Reset code
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} - Reset result
 */
export const resetPasswordWithCode = async (phone, code, newPassword) => {
  const prisma = getPrisma();
  const normalizedPhone = normalizePhone(phone);

  // First verify the code
  await verifyPasswordResetCode(phone, code);

  // Validate new password strength
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.isValid) {
    const errorMessage = passwordValidation.errors.length === 1
      ? `Password ${passwordValidation.errors[0].toLowerCase()}.`
      : `Password needs to meet the following requirements:\n• ${passwordValidation.errors.join("\n• ")}`;

    throw new AppError(errorMessage, 400);
  }

  // Find user
  const user = await prisma.user.findFirst({
    where: { phone: normalizedPhone },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Hash new password
  const newPasswordHash = await hashPassword(newPassword);

  // Update user password
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newPasswordHash },
  });

  // Clean up any remaining unused tokens for this phone
  await prisma.passwordResetToken.updateMany({
    where: {
      phone: normalizedPhone,
      used: false,
    },
    data: {
      used: true,
      usedAt: new Date(),
    },
  });

  return {
    success: true,
    message: "Password reset successfully",
  };
};