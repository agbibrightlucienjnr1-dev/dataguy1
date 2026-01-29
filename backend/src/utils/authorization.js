/**
 * Authorization utility functions
 */

/**
 * Check if user is admin
 * @param {Object} user - User object from JWT token
 * @returns {boolean}
 */
export const isAdmin = (user) => {
  return user && user.role === "admin";
};

/**
 * Check if user is agent
 * @param {Object} user - User object from JWT token
 * @returns {boolean}
 */
export const isAgent = (user) => {
  return user && user.role === "agent";
};

/**
 * Check if user is sub-agent
 * @param {Object} user - User object from JWT token
 * @returns {boolean}
 */
export const isSubAgent = (user) => {
  return user && user.role === "sub_agent";
};

/**
 * Check if user can access resource
 * @param {Object} user - User object from JWT token
 * @param {string} resourceUserId - User ID of the resource owner
 * @returns {boolean}
 */
export const canAccessResource = (user, resourceUserId) => {
  if (!user || !resourceUserId) {
    return false;
  }

  // Admin has full access
  if (isAdmin(user)) {
    return true;
  }

  // User can access their own resource
  return user.id === resourceUserId;
};

/**
 * Check if agent can access sub-agent data
 * @param {Object} user - Agent user object
 * @param {string} subAgentParentId - Parent agent ID of the sub-agent
 * @returns {boolean}
 */
export const canAccessSubAgentData = (user, subAgentParentId) => {
  if (!user || !subAgentParentId) {
    return false;
  }

  // Admin has full access
  if (isAdmin(user)) {
    return true;
  }

  // Agent can access their sub-agents' data
  if (isAgent(user)) {
    return user.id === subAgentParentId;
  }

  return false;
};

/**
 * Build query filter based on user role
 * @param {Object} user - User object from JWT token
 * @returns {Object} - Prisma where clause filter
 */
export const buildUserFilter = (user) => {
  if (!user) {
    return {};
  }

  // Admin sees everything - no filter
  if (isAdmin(user)) {
    return {};
  }

  // Agents and sub-agents only see their own data
  if (isAgent(user) || isSubAgent(user)) {
    return { userId: user.id };
  }

  return {};
};

/**
 * Build query filter for agents to see their sub-agents' data too
 * @param {Object} user - User object from JWT token
 * @returns {Object} - Prisma where clause filter
 */
export const buildAgentHierarchyFilter = (user) => {
  if (!user) {
    return {};
  }

  // Admin sees everything - no filter
  if (isAdmin(user)) {
    return {};
  }

  // Agents see their own data and their sub-agents' data
  if (isAgent(user)) {
    return {
      OR: [
        { userId: user.id }, // Own data
        { user: { parentAgentId: user.id } }, // Sub-agents' data
      ],
    };
  }

  // Sub-agents only see their own data
  if (isSubAgent(user)) {
    return { userId: user.id };
  }

  return {};
};
