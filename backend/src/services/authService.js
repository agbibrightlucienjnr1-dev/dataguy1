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
 * Helper to generate the next multiple of 3 or 4 agent code
 * @param {Object} prisma - Prisma client instance
 * @returns {Promise<number>} - Next valid agent code
 */
const getNextAgentCode = async (prisma) => {
  const result = await prisma.user.aggregate({
    _max: { agentCode: true },
  });
  let nextCode = (result._max.agentCode || 0) + 1;
  while (nextCode % 3 !== 0 && nextCode % 4 !== 0) {
    nextCode++;
  }
  return nextCode;
};

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
      throw new AppError(
        "The referral code you entered is invalid or has expired. Please check the code and try again, or contact the agent who provided it.",
        400,
      );
    }
  } else if (role === "agent" && referralCode) {
    throw new AppError("Agents cannot use referral codes", 400);
  }

  // Check if email already exists
  const existingEmail = await prisma.user.findUnique({
    where: { email },
  });

  if (existingEmail) {
    throw new AppError(
      "An account with this email address already exists. Please use a different email or try logging in instead.",
      400,
    );
  }

  // Check if phone already exists
  const existingPhone = await prisma.user.findFirst({
    where: { phone },
  });

  if (existingPhone) {
    throw new AppError(
      "An account with this phone number already exists. Please use a different phone number or try logging in instead.",
      400,
    );
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Generate unique payment link code
  const paymentLinkCode = createId();

  // Generate next multiple of 3 or 4 agent code
  const nextAgentCode = await getNextAgentCode(prisma);

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
      agentCode: nextAgentCode,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      parentAgentId: true,
      paymentLinkCode: true,
      agentCode: true,
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
    // Don't reveal if user exists - use generic message for security
    throw new AppError(
      "The phone number or password you entered is incorrect. Please check your credentials and try again.",
      401,
    );
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.passwordHash);

  if (!isPasswordValid) {
    // Don't reveal if user exists - use generic message for security
    throw new AppError(
      "The phone number or password you entered is incorrect. Please check your credentials and try again.",
      401,
    );
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
        agentCode: true,
        preferences: true,
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

/**
 * Update user preferences
 * @param {string} userId - User ID
 * @param {Object} preferences - User preferences
 * @returns {Promise<Object>} - Updated user
 */
export const updateUserPreferences = async (userId, preferences) => {
  const prisma = getPrisma();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { preferences: true },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Merge the existing preferences with the new ones
  const mergedPreferences = {
    ...(user.preferences || {}),
    ...preferences,
  };

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { preferences: mergedPreferences },
    select: { preferences: true },
  });

  return updatedUser;
};