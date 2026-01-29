import apiClient from "./client";

export const pricingApi = {
  // ========== Agent Pricing ==========

  /**
   * Get agent's custom prices
   */
  getAgentPrices: () => apiClient.get("/agent-prices"),

  /**
   * Get bundles with agent pricing info
   */
  getAgentBundles: () => apiClient.get("/agent-prices/bundles/all"),

  /**
   * Set price for a single bundle (agent)
   * @param {string} bundleId - Bundle ID
   * @param {Object} data - { customerPrice, subAgentPrice }
   */
  setAgentPrice: (bundleId, data) =>
    apiClient.post(`/agent-prices/${bundleId}`, data),

  /**
   * Update agent price
   * @param {string} bundleId - Bundle ID
   * @param {Object} data - { customerPrice?, subAgentPrice? }
   */
  updateAgentPrice: (bundleId, data) =>
    apiClient.patch(`/agent-prices/${bundleId}`, data),

  /**
   * Bulk set agent prices
   * @param {Array} prices - [{ bundleId, customerPrice, subAgentPrice }]
   */
  bulkSetAgentPrices: (prices) =>
    apiClient.post("/agent-prices/bulk", { prices }),

  // ========== Sub-Agent Pricing ==========

  /**
   * Get sub-agent's custom prices
   */
  getSubAgentPrices: () => apiClient.get("/sub-agent-prices"),

  /**
   * Get bundles with sub-agent pricing info
   */
  getSubAgentBundles: () => apiClient.get("/sub-agent-prices/bundles/all"),

  /**
   * Set price for a single bundle (sub-agent)
   * @param {string} bundleId - Bundle ID
   * @param {Object} data - { customerPrice }
   */
  setSubAgentPrice: (bundleId, data) =>
    apiClient.post(`/sub-agent-prices/${bundleId}`, data),

  /**
   * Bulk set sub-agent prices
   * @param {Array} prices - [{ bundleId, customerPrice }]
   */
  bulkSetSubAgentPrices: (prices) =>
    apiClient.post("/sub-agent-prices/bulk", { prices }),
};
