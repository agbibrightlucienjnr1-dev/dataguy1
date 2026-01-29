import apiClient from "./client";

export const ordersApi = {
  /**
   * Create order from payment link (public - customer purchase)
   * @param {string} code - Payment link code
   * @param {Object} data - { bundleId, phone, email? }
   */
  createFromLink: (code, data) =>
    apiClient.post(`/orders/link/${code}/purchase`, data),

  /**
   * Track order by ID (public)
   * @param {string} orderId - Order ID
   */
  track: (orderId) => apiClient.get(`/orders/${orderId}`),

  /**
   * Track orders by phone number (public)
   * @param {string} phone - Customer phone number
   */
  trackByPhone: (phone) => apiClient.get(`/orders/track/${phone}`),

  /**
   * Get authenticated seller's orders
   * @param {Object} params - { status?, network?, page?, limit? }
   */
  getMyOrders: (params) => apiClient.get("/orders", { params }),

  /**
   * Get seller's order statistics
   */
  getMyStats: () => apiClient.get("/orders/stats"),

  /**
   * Get order by ID (authenticated)
   * @param {string} id - Order ID
   */
  getById: (id) => apiClient.get(`/orders/${id}`),
};
