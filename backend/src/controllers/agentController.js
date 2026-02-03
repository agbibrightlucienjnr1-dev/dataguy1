import { asyncHandler } from "../middlewares/errorHandler.js";
import { getAgentSubAgents } from "../services/agentService.js";

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
