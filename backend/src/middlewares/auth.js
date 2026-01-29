import { verifyToken } from "../utils/jwt.js";
import { AppError } from "./errorHandler.js";

/**
 * Middleware to verify JWT token and attach user to request
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("No token provided. Authorization required.", 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyToken(token);

    // Attach user info to request
    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError(error.message || "Invalid authentication token", 401));
    }
  }
};

/**
 * Middleware to check if user has specific role
 * @param  {...string} allowedRoles - Roles that are allowed to access
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Required roles: ${allowedRoles.join(", ")}`,
          403,
        ),
      );
    }

    next();
  };
};

/**
 * Check if user is an admin
 */
export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication required", 401));
  }

  if (req.user.role !== "admin") {
    return next(new AppError("Access denied. Admin access required.", 403));
  }

  next();
};

/**
 * Check if user can access a resource (either admin or owns the resource)
 * @param {string} userIdParam - Name of the parameter containing user ID (default: 'userId')
 */
export const canAccessResource = (userIdParam = "userId") => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    // Admin has full access
    if (req.user.role === "admin") {
      return next();
    }

    // Get the resource owner's user ID from params, body, or query
    const resourceUserId =
      req.params[userIdParam] ||
      req.body[userIdParam] ||
      req.query[userIdParam];

    // Check if user is accessing their own resource
    if (resourceUserId && resourceUserId !== req.user.id) {
      return next(
        new AppError("Access denied. You can only access your own data.", 403),
      );
    }

    next();
  };
};

/**
 * Ensure agents and sub-agents can only access their own data
 * Adds userId filter to query parameters automatically
 */
export const filterOwnData = (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication required", 401));
  }

  // Admin can see all data - no filtering
  if (req.user.role === "admin") {
    return next();
  }

  // For agents and sub-agents, restrict to their own data
  if (req.user.role === "agent" || req.user.role === "sub_agent") {
    // Add userId to query filters
    req.userFilter = { userId: req.user.id };
  }

  next();
};

/**
 * Check if agent can access sub-agent data (for parent-child relationship)
 */
export const canAccessSubAgentData = async (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication required", 401));
  }

  // Admin has full access
  if (req.user.role === "admin") {
    return next();
  }

  const targetUserId = req.params.userId || req.body.userId || req.query.userId;

  // If accessing own data, allow
  if (targetUserId === req.user.id) {
    return next();
  }

  // If agent, check if target is their sub-agent
  if (req.user.role === "agent" && targetUserId) {
    // This check should be done in the service layer with DB query
    // For now, we'll allow and let the service handle the validation
    req.checkSubAgentRelation = true;
    return next();
  }

  // Sub-agents can only access their own data
  if (req.user.role === "sub_agent") {
    return next(
      new AppError("Access denied. You can only access your own data.", 403),
    );
  }

  next();
};
