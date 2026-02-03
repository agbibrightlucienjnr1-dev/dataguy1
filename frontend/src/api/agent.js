import apiClient from "./client";

export const agentApi = {
  /**
   * Get agent's sub-agents
   */
  getSubAgents: () => apiClient.get("/agent/sub-agents"),
};
