import apiClient from "./client";

export const adminApi = {
  // ========== Dashboard ==========

  /**
   * Get admin dashboard summary
   */
  getDashboard: () => apiClient.get("/admin/dashboard"),

  /**
   * Get platform statistics
   */
  getStatistics: () => apiClient.get("/admin/statistics"),

  // ========== Users ==========

  /**
   * Get all users
   * @param {Object} params - { role?, search?, page?, limit? }
   */
  getUsers: (params) => apiClient.get("/admin/users", { params }),

  /**
   * Get user by ID
   * @param {string} id - User ID
   */
  getUserById: (id) => apiClient.get(`/admin/users/${id}`),

  // ========== Orders ==========

  /**
   * Get all orders
   * @param {Object} params - { status?, userId?, network?, page?, limit? }
   */
  getAllOrders: (params) => apiClient.get("/admin/orders", { params }),

  /**
   * Get failed orders
   */
  getFailedOrders: () => apiClient.get("/admin/orders/failed"),

  // ========== Bundles ==========

  /**
   * Toggle bundle active status
   * @param {string} id - Bundle ID
   * @param {boolean} isActive - New status
   */
  toggleBundleStatus: (id, isActive) =>
    apiClient.patch(`/admin/bundles/${id}/status`, { isActive }),

  // ========== Wallets ==========

  /**
   * Get all wallet balances
   * @param {Object} params - { page?, limit? }
   */
  getAllWallets: (params) => apiClient.get("/admin/wallets", { params }),

  // ========== Withdrawals ==========

  /**
   * Get all withdrawals
   * @param {Object} params - { status?, userId?, page?, limit? }
   */
  getAllWithdrawals: (params) =>
    apiClient.get("/withdrawals/admin/all", { params }),

  /**
   * Approve withdrawal
   * @param {string} id - Withdrawal ID
   */
  approveWithdrawal: (id) => apiClient.put(`/withdrawals/${id}/approve`),

  /**
   * Reject withdrawal
   * @param {string} id - Withdrawal ID
   * @param {string} reason - Rejection reason
   */
  rejectWithdrawal: (id, reason) =>
    apiClient.put(`/withdrawals/${id}/reject`, { reason }),
};
