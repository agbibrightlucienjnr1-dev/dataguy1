import { asyncHandler } from "../middlewares/errorHandler.js";
import {
  registerUser,
  loginUser,
  getUserById,
  changePassword,
  updateUserPreferences,
} from "../services/authService.js";
import { validatePasswordStrength } from "../utils/password.js";
import { AppError } from "../middlewares/errorHandler.js";

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role, referralCode } = req.body;

  // Validate required fields
  if (!name || !email || !phone || !password) {
    throw new AppError(
      "Please fill in all required fields: name, email, phone number, and password.",
      400,
    );
  }

  // Validate password strength
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.isValid) {
    // Format password errors in a user-friendly way
    const errorMessage =
      passwordValidation.errors.length === 1
        ? `Your password ${passwordValidation.errors[0].toLowerCase()}.`
        : `Your password needs to meet the following requirements:\n• ${passwordValidation.errors.join("\n• ")}`;
    
    throw new AppError(errorMessage, 400);
  }

  // Register user
  const result = await registerUser({
    name,
    email,
    phone,
    password,
    role,
    referralCode,
  });

  // Generate payment link for agents and sub-agents
  let paymentLink = null;
  if (result.user.role === "agent" || result.user.role === "sub_agent") {
    const baseUrl =
      process.env.FRONTEND_URL ||
      `http://localhost:${process.env.PORT || 3000}`;
    paymentLink = `${baseUrl}/buy/${result.user.paymentLinkCode}`;
  }

  res.status(201).json({
    success: true,
    message: "Registration successful",
    data: {
      ...result,
      paymentLink,
    },
  });
});

/**
 * Login user
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { phone, password } = req.body;

  // Validate required fields
  if (!phone || !password) {
    throw new AppError(
      "Please enter both your phone number and password to sign in.",
      400,
    );
  }

  // Login user
  const result = await loginUser(phone, password);

  // Generate payment link for agents and sub-agents
  let paymentLink = null;
  if (result.user.role === "agent" || result.user.role === "sub_agent") {
    const baseUrl =
      process.env.FRONTEND_URL ||
      `http://localhost:${process.env.PORT || 3000}`;
    paymentLink = `${baseUrl}/buy/${result.user.paymentLinkCode}`;
  }

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      ...result,
      paymentLink,
    },
  });
});

/**
 * Get current user profile
 * GET /api/auth/me
 */
export const getMe = asyncHandler(async (req, res) => {
  // req.user is attached by authenticate middleware
  const user = await getUserById(req.user.id);

  // Generate payment link for agents and sub-agents
  let paymentLink = null;
  if (user.role === "agent" || user.role === "sub_agent") {
    const baseUrl =
      process.env.FRONTEND_URL ||
      `http://localhost:${process.env.PORT || 3000}`;
    paymentLink = `${baseUrl}/buy/${user.paymentLinkCode}`;
  }

  res.status(200).json({
    success: true,
    data: {
      user,
      paymentLink,
    },
  });
});

/**
 * Change user password
 * PATCH /api/auth/change-password
 */
export const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id; // From authenticate middleware

  // Validate required fields
  if (!currentPassword || !newPassword) {
    throw new AppError("Current password and new password are required", 400);
  }

  // Change password
  await changePassword(userId, currentPassword, newPassword);

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
});

/**
 * Update user preferences
 * PATCH /api/auth/preferences
 */
export const updatePreferences = asyncHandler(async (req, res) => {
  const { preferences } = req.body;
  const userId = req.user.id;

  if (!preferences) {
    throw new AppError("Preferences object is required", 400);
  }

  const updatedUser = await updateUserPreferences(userId, preferences);

  res.status(200).json({
    success: true,
    message: "Preferences updated successfully",
    data: {
      preferences: updatedUser.preferences,
    },
  });
});
