import apiClient from "./client";

export const bundlesApi = {
  /**
   * Get all bundles (authenticated - with role-based pricing)
   * @param {Object} params - { network?, page?, limit? }
   */
  getAll: (params) => apiClient.get("/bundles", { params }),

  /**
   * Get active bundles only (public)
   */
  getActive: () => apiClient.get("/bundles/active"),

  /**
   * Get bundle by ID
   * @param {string} id - Bundle ID
   */
  getById: (id) => apiClient.get(`/bundles/${id}`),

  /**
   * Get seller info from payment link code
   * @param {string} code - Payment link code
   */
  getSellerInfo: (code) => apiClient.get(`/orders/link/${code}/seller`),

  /**
   * Get bundles with seller's pricing for payment link
   * @param {string} code - Payment link code
   */
  getByPaymentLink: (code) => apiClient.get(`/orders/link/${code}/bundles`),
};
