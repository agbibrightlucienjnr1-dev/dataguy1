import apiClient from "./client";

export const authApi = {
  /**
   * Register a new user
   * @param {Object} data - { name, email, phone, password, role? }
   */
  register: (data) => apiClient.post("/auth/register", data),

  /**
   * Login with email and password
   * @param {Object} data - { email, password }
   */
  login: (data) => apiClient.post("/auth/login", data),

  /**
   * Get current authenticated user's profile
   */
  getProfile: () => apiClient.get("/auth/me"),
};
