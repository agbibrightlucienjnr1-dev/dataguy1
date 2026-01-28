import { getPrisma } from "../config/database.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateAuthToken } from "../utils/jwt.js";
import { AppError } from "../middlewares/errorHandler.js";

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
  if (role === "sub_agent") {
    if (!referralCode) {
      throw new AppError(
        "Referral code required for sub-agent registration",
        400,
      );
    }

    // Verify referral code belongs to an agent
    const parentAgent = await prisma.user.findFirst({
      where: {
        id: referralCode,
        role: "agent",
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

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash,
      role: role || "agent",
      parentAgentId: role === "sub_agent" ? referralCode : null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      parentAgentId: true,
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

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      parentAgentId: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};
