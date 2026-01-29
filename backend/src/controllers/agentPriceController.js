import { asyncHandler } from "../middlewares/errorHandler.js";
import {
  setAgentPrice,
  getAgentPrices,
  getAgentPriceForBundle,
  getBundlesWithAgentPricing,
  deleteAgentPrice,
  bulkSetAgentPrices,
} from "../services/agentPriceService.js";
import { AppError } from "../middlewares/errorHandler.js";

/**
 * Set or update agent price for a bundle
 * POST/PATCH /api/agent-prices/:bundleId
 */
export const setPrice = asyncHandler(async (req, res) => {
  const { bundleId } = req.params;
  const { customerPrice, subAgentPrice } = req.body;
  const agentId = req.user.id;

  // Only agents can set prices (not sub-agents)
  if (req.user.role !== "agent") {
    throw new AppError("Only agents can set their own prices", 403);
  }

  // Validate required fields
  if (!customerPrice || !subAgentPrice) {
    throw new AppError("Customer price and sub-agent price are required", 400);
  }

  const agentPrice = await setAgentPrice(agentId, bundleId, {
    customerPrice,
    subAgentPrice,
  });

  res.status(200).json({
    success: true,
    message: "Agent price set successfully",
    data: { agentPrice },
  });
});

/**
 * Get all agent prices
 * GET /api/agent-prices
 */
export const getMyPrices = asyncHandler(async (req, res) => {
  const agentId = req.user.id;

  // Only agents can view their prices
  if (req.user.role !== "agent") {
    throw new AppError("Only agents can view their prices", 403);
  }

  const prices = await getAgentPrices(agentId);

  res.status(200).json({
    success: true,
    data: { prices, count: prices.length },
  });
});

/**
 * Get agent price for a specific bundle
 * GET /api/agent-prices/:bundleId
 */
export const getPriceForBundle = asyncHandler(async (req, res) => {
  const { bundleId } = req.params;
  const agentId = req.user.id;

  if (req.user.role !== "agent") {
    throw new AppError("Only agents can view their prices", 403);
  }

  const agentPrice = await getAgentPriceForBundle(agentId, bundleId);

  res.status(200).json({
    success: true,
    data: { agentPrice },
  });
});

/**
 * Get all bundles with agent's pricing
 * GET /api/agent-prices/bundles/all
 */
export const getBundlesWithPricing = asyncHandler(async (req, res) => {
  const agentId = req.user.id;

  if (req.user.role !== "agent") {
    throw new AppError("Only agents can view bundle pricing", 403);
  }

  const bundles = await getBundlesWithAgentPricing(agentId);

  res.status(200).json({
    success: true,
    data: { bundles, count: bundles.length },
  });
});

/**
 * Delete agent price for a bundle
 * DELETE /api/agent-prices/:bundleId
 */
export const deletePrice = asyncHandler(async (req, res) => {
  const { bundleId } = req.params;
  const agentId = req.user.id;

  if (req.user.role !== "agent") {
    throw new AppError("Only agents can delete their prices", 403);
  }

  await deleteAgentPrice(agentId, bundleId);

  res.status(200).json({
    success: true,
    message: "Agent price deleted successfully",
  });
});

/**
 * Bulk set prices for multiple bundles
 * POST /api/agent-prices/bulk
 */
export const bulkSetPrices = asyncHandler(async (req, res) => {
  const { prices } = req.body;
  const agentId = req.user.id;

  if (req.user.role !== "agent") {
    throw new AppError("Only agents can set prices", 403);
  }

  if (!Array.isArray(prices) || prices.length === 0) {
    throw new AppError("Prices array is required", 400);
  }

  const result = await bulkSetAgentPrices(agentId, prices);

  res.status(200).json({
    success: true,
    message: `Successfully set ${result.success} prices, ${result.failed} failed`,
    data: result,
  });
});
