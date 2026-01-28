import jwt from "jsonwebtoken";

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET must be defined in environment variables");
  }
  return secret;
};

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/**
 * Generate JWT token for a user
 * @param {Object} payload - User data to encode in token
 * @returns {string} - JWT token
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: JWT_EXPIRES_IN,
  });
};

/**
 * Verify and decode JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} - Decoded token payload
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Token has expired");
    }
    if (error.name === "JsonWebTokenError") {
      throw new Error("Invalid token");
    }
    throw error;
  }
};

/**
 * Generate token for user authentication
 * @param {Object} user - User object from database
 * @returns {string} - JWT token
 */
export const generateAuthToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    phone: user.phone,
    role: user.role,
    parentAgentId: user.parentAgentId,
  };

  return generateToken(payload);
};
