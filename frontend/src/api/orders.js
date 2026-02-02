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
  track: (orderId) => apiClient.get(`/orders/track/${orderId}`),

  /**
   * Track orders by phone number (public)
   * @param {string} phone - Customer phone number
   */
  trackByPhone: (phone) => apiClient.get(`/orders/track/phone/${phone}`),

  /**
   * Get authenticated seller's orders
   * @param {Object} params - { status?, network?, page?, limit? }
   */
  getMyOrders: (params) =>
    apiClient.get("/orders/seller/my-orders", { params }),

  /**
   * Get seller's order statistics
   */
  getMyStats: () => apiClient.get("/orders/seller/stats"),

  /**
   * Get order by ID (authenticated)
   * @param {string} id - Order ID
   */
  getById: (id) => apiClient.get(`/orders/${id}`),

  /**
   * Get seller info by payment link code (public)
   * @param {string} code - Payment link code
   */
  getSellerInfo: (code) => apiClient.get(`/orders/link/${code}`),
};
