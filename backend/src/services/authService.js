import { getPrisma } from "../config/database.js";
import {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
} from "../utils/password.js";
import { generateAuthToken } from "../utils/jwt.js";
import { AppError } from "../middlewares/errorHandler.js";
import { createId } from "@paralleldrive/cuid2";

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} - Created user and token
 */
export const registerUser = async (userData) => {
  const prisma = getPrisma();
  const { name, email, phone, password, role, referralCode } = userData;

  // Validate role restrictions
  if (role === "admin") {
    throw new AppError("Admin accounts cannot be registered via API", 403);
  }

  // Sub-agents must have a referral code
  let parentAgent = null;
  if (role === "sub_agent") {
    if (!referralCode) {
      throw new AppError(
        "Referral code required for sub-agent registration",
        400,
      );
    }

    // Verify referral code (payment link code) belongs to an agent
    // Try to find agent by payment link code first, then by id (for backward compatibility)
    parentAgent = await prisma.user.findFirst({
      where: {
        OR: [
          { paymentLinkCode: referralCode, role: "agent" },
          { id: referralCode, role: "agent" }, // Backward compatibility
        ],
      },
    });

    if (!parentAgent) {
      throw new AppError("Invalid referral code", 400);
    }
  } else if (role === "agent" && referralCode) {
    throw new AppError("Agents cannot use referral codes", 400);
  }

  // Check if email already exists
  const existingEmail = await prisma.user.findUnique({
    where: { email },
  });

  if (existingEmail) {
    throw new AppError("Email already registered", 400);
  }

  // Check if phone already exists
  const existingPhone = await prisma.user.findFirst({
    where: { phone },
  });

  if (existingPhone) {
    throw new AppError("Phone number already registered", 400);
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Generate unique payment link code
  const paymentLinkCode = createId();

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash,
      role: role || "agent",
      parentAgentId: role === "sub_agent" ? parentAgent.id : null,
      paymentLinkCode,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      parentAgentId: true,
      paymentLinkCode: true,
      createdAt: true,
    },
  });

  // Generate token
  const token = generateAuthToken(user);

  return {
    user,
    token,
  };
};

/**
 * Login user with phone and password
 * @param {string} phone - User's phone number
 * @param {string} password - User's password
 * @returns {Promise<Object>} - User and token
 */
export const loginUser = async (phone, password) => {
  const prisma = getPrisma();

  // Find user by phone
  const user = await prisma.user.findFirst({
    where: { phone },
  });

  if (!user) {
    throw new AppError("Invalid phone number or password", 401);
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError("Invalid phone number or password", 401);
  }

  // Generate token
  const token = generateAuthToken(user);

  // Return user without password hash
  const { passwordHash, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    token,
  };
};

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - User data
 */
export const getUserById = async (userId) => {
  const prisma = getPrisma();

  if (!userId) {
    throw new AppError("User ID is required", 400);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        parentAgentId: true,
        paymentLinkCode: true,
        createdAt: true,
        wallet: {
          select: {
            balance: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Flatten wallet balance onto user object
    // Handle case where wallet might not exist (e.g., for admin users)
    let walletBalance = "0.00";

    if (user.wallet) {
      try {
        walletBalance =
          user.wallet.balance != null
            ? String(user.wallet.balance)
            : "0.00";
      } catch (walletError) {
        // If there's an error converting wallet values, use defaults
        console.warn("Error processing wallet values:", walletError);
        walletBalance = "0.00";
      }
    }

    // Remove wallet object from response and add flattened values
    const { wallet: _wallet, ...userWithoutWallet } = user;

    return {
      ...userWithoutWallet,
      walletBalance,
    };
  } catch (error) {
    // If it's already an AppError, re-throw it
    if (error instanceof AppError) {
      throw error;
    }
    // Log the actual error for debugging
    console.error("Error in getUserById:", {
      userId,
      error: error.message,
      stack: error.stack,
    });
    // Otherwise, wrap it in an AppError
    throw new AppError(
      `Failed to get user: ${error.message}`,
      500,
    );
  }
};

/**
 * Change user password
 * @param {string} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<void>}
 */
export const changePassword = async (userId, currentPassword, newPassword) => {
  const prisma = getPrisma();

  // Get user with password hash
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      passwordHash: true,
    },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Verify current password
  const isCurrentPasswordValid = await comparePassword(
    currentPassword,
    user.passwordHash,
  );

  if (!isCurrentPasswordValid) {
    throw new AppError("Current password is incorrect", 400);
  }

  // Validate new password strength
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.isValid) {
    throw new AppError(
      `Password validation failed: ${passwordValidation.errors.join(", ")}`,
      400,
    );
  }

  // Check if new password is different from current
  const isSamePassword = await comparePassword(newPassword, user.passwordHash);
  if (isSamePassword) {
    throw new AppError(
      "New password must be different from current password",
      400,
    );
  }

  // Hash new password
  const newPasswordHash = await hashPassword(newPassword);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash },
  });
};