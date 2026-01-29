import apiClient from "./client";

export const walletApi = {
  /**
   * Get authenticated user's wallet balance
   */
  getBalance: () => apiClient.get("/wallet"),

  /**
   * Get wallet transaction history
   * @param {Object} params - { type?, status?, page?, limit? }
   */
  getTransactions: (params) =>
    apiClient.get("/wallet/transactions", { params }),

  /**
   * Get wallet summary/statistics
   */
  getSummary: () => apiClient.get("/wallet/summary"),
};
