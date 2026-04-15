import apiClient from "./client";

export const authApi = {
  /**
   * Register a new user
   * @param {Object} data - { name, email, phone, password, role? }
   */
  register: (data) => apiClient.post("/auth/register", data),

  /**
   * Login with phone and password
   * @param {Object} data - { phone, password }
   */
  login: (data) => apiClient.post("/auth/login", data),

  /**
   * Get current authenticated user's profile
   */
  getProfile: () => apiClient.get("/auth/me"),

  /**
   * Change user password
   * @param {Object} data - { currentPassword, newPassword }
   */
  changePassword: (data) => apiClient.patch("/auth/change-password", data),

  /**
   * Update user preferences
   * @param {Object} preferences - Preferences object
   */
  updatePreferences: (preferences) => apiClient.patch("/auth/preferences", { preferences }),

  /**
   * Request password reset
   * @param {Object} data - { phone }
   */
  forgotPassword: (data) => apiClient.post("/auth/forgot-password", data),

  /**
   * Reset password with code
   * @param {Object} data - { phone, code, newPassword, confirmPassword }
   */
  resetPassword: (data) => apiClient.post("/auth/reset-password", data),
};
