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

  /**
   * Fulfill order - trigger Hubnet data delivery
   * @param {string} orderId - Order ID
   */
  fulfillOrder: (orderId) => apiClient.post(`/admin/orders/${orderId}/fulfill`),

  /**
   * Mark order as completed - manually confirm delivery
   * @param {string} orderId - Order ID
   */
  markOrderCompleted: (orderId) =>
    apiClient.post(`/admin/orders/${orderId}/complete`),

  // ========== Bundles ==========

  /**
   * Create a new data bundle
   * @param {Object} data - { network, volume, hubnetCost, adminPrice }
   */
  createBundle: (data) => apiClient.post("/bundles", data),

  /**
   * Update a data bundle
   * @param {string} id - Bundle ID
   * @param {Object} data - { hubnetCost?, adminPrice?, isActive? }
   */
  updateBundle: (id, data) => apiClient.patch(`/bundles/${id}`, data),

  /**
   * Delete a data bundle
   * @param {string} id - Bundle ID
   */
  deleteBundle: (id) => apiClient.delete(`/bundles/${id}`),

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
   * @param {boolean} manual - If true, skip Paystack and process manually
   */
  approveWithdrawal: (id, manual = false) =>
    apiClient.put(`/withdrawals/${id}/approve${manual ? "?manual=true" : ""}`),

  /**
   * Complete withdrawal manually (for processing status withdrawals)
   * @param {string} id - Withdrawal ID
   * @param {string} note - Optional note
   */
  completeWithdrawal: (id, note = null) =>
    apiClient.put(`/withdrawals/${id}/complete`, { note }),

  /**
   * Reject withdrawal
   * @param {string} id - Withdrawal ID
   * @param {string} reason - Rejection reason
   */
  rejectWithdrawal: (id, reason) =>
    apiClient.put(`/withdrawals/${id}/reject`, { reason }),

  // ========== Hubnet ==========

  /**
   * Get Hubnet wallet balance
   */
  getHubnetBalance: () => apiClient.get("/admin/hubnet-balance"),

  /**
   * Get total wallet balance for all agents and sub-agents
   */
  getTotalWalletBalance: () => apiClient.get("/admin/total-wallet-balance"),

  // ========== System Management ==========

  /**
   * Get database size statistics
   */
  getDatabaseStats: () => apiClient.get("/admin/database/stats"),

  /**
   * Get memory usage statistics
   */
  getMemoryStats: () => apiClient.get("/admin/memory/stats"),

  /**
   * Run database cleanup
   * @param {Object} data - { archiveOrdersDays?, cleanupTransactionsDays?, hardDeleteOrders?, optimize? }
   */
  runDatabaseCleanup: (data) => apiClient.post("/admin/database/cleanup", data),

  /**
   * Optimize database
   */
  optimizeDatabase: () => apiClient.post("/admin/database/optimize"),

  // ========== Cache Management ==========

  /**
   * Get cache statistics
   */
  getCacheStats: () => apiClient.get("/admin/cache/stats"),

  /**
   * Clear all cache
   */
  clearCache: () => apiClient.post("/admin/cache/clear"),

  // ========== Analytics ==========
  /**
   * Get analytics reports data
   */
  getReportsData: () => apiClient.get("/admin/reports"),
  // ========== Settings ==========

  /**
   * Get system settings
   */
  getSystemSettings: () => apiClient.get("/settings"),

  /**
   * Update system settings
   * @param {Object} data - Settings data
   */
  updateSystemSettings: (data) => apiClient.put("/settings", data),

  /**
   * Send SMS to targets
   * @param {Object} data - { target: string, customNumber?: string, message: string }
   */
  sendSMS: (data) => apiClient.post("/admin/sms/send", data),
};
