import { asyncHandler } from "../middlewares/errorHandler.js";
import {
  registerUser,
  loginUser,
  getUserById,
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
    throw new AppError("Name, email, phone, and password are required", 400);
  }

  // Validate password strength
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.isValid) {
    throw new AppError(
      `Password validation failed: ${passwordValidation.errors.join(", ")}`,
      400,
    );
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
    throw new AppError("Phone and password are required", 400);
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
