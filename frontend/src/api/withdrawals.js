import apiClient from "./client";

export const withdrawalsApi = {
  /**
   * Get list of Ghana banks
   */
  getBanks: () => apiClient.get("/withdrawals/banks"),

  /**
   * Verify bank account number
   * @param {Object} data - { accountNumber, bankCode }
   */
  verifyAccount: (data) => apiClient.post("/withdrawals/verify-account", data),

  /**
   * Create withdrawal request
   * @param {Object} data - { amount, accountType, accountNumber, accountName, bankName?, mobileNetwork? }
   */
  create: (data) => apiClient.post("/withdrawals", data),

  /**
   * Get authenticated user's withdrawals
   * @param {Object} params - { status?, page?, limit? }
   */
  getMyWithdrawals: (params) => apiClient.get("/withdrawals", { params }),

  /**
   * Get withdrawal by ID
   * @param {string} id - Withdrawal ID
   */
  getById: (id) => apiClient.get(`/withdrawals/${id}`),

  /**
   * Get withdrawal statistics
   */
  getStats: () => apiClient.get("/withdrawals/stats"),
};
