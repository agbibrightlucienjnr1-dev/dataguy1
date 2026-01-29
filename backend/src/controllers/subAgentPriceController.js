import { asyncHandler } from "../middlewares/errorHandler.js";
import {
  setSubAgentPrice,
  getSubAgentPrices,
  getSubAgentPriceForBundle,
  getBundlesWithSubAgentPricing,
  deleteSubAgentPrice,
  bulkSetSubAgentPrices,
} from "../services/subAgentPriceService.js";
import { AppError } from "../middlewares/errorHandler.js";

/**
 * Set or update sub-agent price for a bundle
 * POST/PATCH /api/sub-agent-prices/:bundleId
 */
export const setPrice = asyncHandler(async (req, res) => {
  const { bundleId } = req.params;
  const { customerPrice } = req.body;
  const subAgentId = req.user.id;

  // Only sub-agents can set prices
  if (req.user.role !== "sub_agent") {
    throw new AppError("Only sub-agents can set their own prices", 403);
  }

  // Validate required fields
  if (!customerPrice) {
    throw new AppError("Customer price is required", 400);
  }

  const subAgentPrice = await setSubAgentPrice(
    subAgentId,
    bundleId,
    customerPrice,
  );

  res.status(200).json({
    success: true,
    message: "Sub-agent price set successfully",
    data: { subAgentPrice },
  });
});

/**
 * Get all sub-agent prices
 * GET /api/sub-agent-prices
 */
export const getMyPrices = asyncHandler(async (req, res) => {
  const subAgentId = req.user.id;

  // Only sub-agents can view their prices
  if (req.user.role !== "sub_agent") {
    throw new AppError("Only sub-agents can view their prices", 403);
  }

  const prices = await getSubAgentPrices(subAgentId);

  res.status(200).json({
    success: true,
    data: { prices, count: prices.length },
  });
});

/**
 * Get sub-agent price for a specific bundle
 * GET /api/sub-agent-prices/:bundleId
 */
export const getPriceForBundle = asyncHandler(async (req, res) => {
  const { bundleId } = req.params;
  const subAgentId = req.user.id;

  if (req.user.role !== "sub_agent") {
    throw new AppError("Only sub-agents can view their prices", 403);
  }

  const subAgentPrice = await getSubAgentPriceForBundle(subAgentId, bundleId);

  res.status(200).json({
    success: true,
    data: { subAgentPrice },
  });
});

/**
 * Get all bundles with sub-agent's pricing
 * GET /api/sub-agent-prices/bundles/all
 */
export const getBundlesWithPricing = asyncHandler(async (req, res) => {
  const subAgentId = req.user.id;

  if (req.user.role !== "sub_agent") {
    throw new AppError("Only sub-agents can view bundle pricing", 403);
  }

  const bundles = await getBundlesWithSubAgentPricing(subAgentId);

  res.status(200).json({
    success: true,
    data: { bundles, count: bundles.length },
  });
});

/**
 * Delete sub-agent price for a bundle
 * DELETE /api/sub-agent-prices/:bundleId
 */
export const deletePrice = asyncHandler(async (req, res) => {
  const { bundleId } = req.params;
  const subAgentId = req.user.id;

  if (req.user.role !== "sub_agent") {
    throw new AppError("Only sub-agents can delete their prices", 403);
  }

  await deleteSubAgentPrice(subAgentId, bundleId);

  res.status(200).json({
    success: true,
    message: "Sub-agent price deleted successfully",
  });
});

/**
 * Bulk set prices for multiple bundles
 * POST /api/sub-agent-prices/bulk
 */
export const bulkSetPrices = asyncHandler(async (req, res) => {
  const { prices } = req.body;
  const subAgentId = req.user.id;

  if (req.user.role !== "sub_agent") {
    throw new AppError("Only sub-agents can set prices", 403);
  }

  if (!Array.isArray(prices) || prices.length === 0) {
    throw new AppError("Prices array is required", 400);
  }

  const result = await bulkSetSubAgentPrices(subAgentId, prices);

  res.status(200).json({
    success: true,
    message: `Successfully set ${result.success} prices, ${result.failed} failed`,
    data: result,
  });
});
