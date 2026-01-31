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
};
