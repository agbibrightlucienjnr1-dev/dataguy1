import apiClient from "./client";

export const agentApi = {
  /**
   * Get agent's sub-agents
   */
  getSubAgents: () => apiClient.get("/agent/sub-agents"),

  /**
   * Update shop name
   */
  updateShopName: (shopName) =>
    apiClient.patch("/agent/shop-name", { shopName }),
};
