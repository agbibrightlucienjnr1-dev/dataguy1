import { asyncHandler } from "../middlewares/errorHandler.js";
import {
  getAgentSubAgents,
  updateAgentShopName,
} from "../services/agentService.js";

/**
 * Get agent's sub-agents
 * GET /api/agent/sub-agents
 */
export const getMySubAgents = asyncHandler(async (req, res) => {
  const agentId = req.user.id;

  const result = await getAgentSubAgents(agentId);

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * Update shop name
 * PATCH /api/agent/shop-name
 */
export const updateShopName = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { shopName } = req.body;

  const result = await updateAgentShopName(userId, shopName);

  res.status(200).json({
    success: true,
    message: "Shop name updated successfully",
    data: result,
  });
});
