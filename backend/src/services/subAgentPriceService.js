import { getPrisma } from "../config/database.js";
import { AppError } from "../middlewares/errorHandler.js";
import { getDataBundleById } from "./dataBundleService.js";

/**
 * Set or update sub-agent pricing for a bundle
 */
export const setSubAgentPrice = async (subAgentId, bundleId, customerPrice) => {
  const prisma = getPrisma();

  // Validate price
  if (parseFloat(customerPrice) <= 0) {
    throw new AppError("Customer price must be greater than zero", 400);
  }

  // Get sub-agent to find parent agent
  const subAgent = await prisma.user.findUnique({
    where: { id: subAgentId },
  });

  if (!subAgent) {
    throw new AppError("Sub-agent not found", 404);
  }

  if (subAgent.role !== "sub_agent") {
    throw new AppError("User is not a sub-agent", 400);
  }

  if (!subAgent.parentAgentId) {
    throw new AppError("Sub-agent must have a parent agent", 400);
  }

  // Get bundle
  const bundle = await getDataBundleById(bundleId);

  // Get parent agent's pricing for this bundle
  const agentPrice = await prisma.agentPrice.findUnique({
    where: {
      agentId_bundleId: {
        agentId: subAgent.parentAgentId,
        bundleId,
      },
    },
  });

  if (!agentPrice) {
    throw new AppError(
      "Parent agent has not set pricing for this bundle yet",
      400,
    );
  }

  // Validate that sub-agent price >= agent's sub-agent price
  if (parseFloat(customerPrice) < parseFloat(agentPrice.subAgentPrice)) {
    throw new AppError(
      `Customer price must be at least GH₵ ${agentPrice.subAgentPrice} (parent agent's sub-agent price)`,
      400,
    );
  }

  // Check if sub-agent price already exists
  const existing = await prisma.subAgentPrice.findUnique({
    where: {
      subAgentId_bundleId: {
        subAgentId,
        bundleId,
      },
    },
  });

  let subAgentPrice;

  if (existing) {
    // Update existing price
    subAgentPrice = await prisma.subAgentPrice.update({
      where: {
        subAgentId_bundleId: {
          subAgentId,
          bundleId,
        },
      },
      data: {
        customerPrice,
      },
      include: {
        bundle: true,
      },
    });
  } else {
    // Create new price
    subAgentPrice = await prisma.subAgentPrice.create({
      data: {
        subAgentId,
        bundleId,
        customerPrice,
      },
      include: {
        bundle: true,
      },
    });
  }

  return subAgentPrice;
};

/**
 * Get all sub-agent prices for a specific sub-agent
 */
export const getSubAgentPrices = async (subAgentId) => {
  const prisma = getPrisma();

  const prices = await prisma.subAgentPrice.findMany({
    where: { subAgentId },
    include: {
      bundle: true,
    },
    orderBy: [{ bundle: { network: "asc" } }, { bundle: { volume: "asc" } }],
  });

  return prices;
};

/**
 * Get sub-agent price for a specific bundle
 */
export const getSubAgentPriceForBundle = async (subAgentId, bundleId) => {
  const prisma = getPrisma();

  const subAgentPrice = await prisma.subAgentPrice.findUnique({
    where: {
      subAgentId_bundleId: {
        subAgentId,
        bundleId,
      },
    },
    include: {
      bundle: true,
    },
  });

  if (!subAgentPrice) {
    throw new AppError("Sub-agent price not found for this bundle", 404);
  }

  return subAgentPrice;
};

/**
 * Get all bundles with sub-agent's pricing and parent agent's pricing
 */
export const getBundlesWithSubAgentPricing = async (subAgentId) => {
  const prisma = getPrisma();

  // Get sub-agent to find parent
  const subAgent = await prisma.user.findUnique({
    where: { id: subAgentId },
  });

  if (!subAgent || !subAgent.parentAgentId) {
    throw new AppError("Sub-agent or parent agent not found", 404);
  }

  // Get all active bundles with parent agent's pricing
  const bundles = await prisma.dataBundle.findMany({
    where: { isActive: true },
    include: {
      agentPrices: {
        where: { agentId: subAgent.parentAgentId },
      },
      subAgentPrices: {
        where: { subAgentId },
      },
    },
    orderBy: [{ network: "asc" }, { volume: "asc" }],
  });

  // Format response with pricing info
  return bundles
    .filter((bundle) => bundle.agentPrices.length > 0) // Only show bundles where parent agent has set pricing
    .map((bundle) => {
      const agentPrice = bundle.agentPrices[0];
      const subAgentPrice = bundle.subAgentPrices[0];

      return {
        id: bundle.id,
        network: bundle.network,
        volume: bundle.volume,
        adminPrice: bundle.adminPrice,
        isActive: bundle.isActive,
        agentPrice: agentPrice.subAgentPrice, // The price the sub-agent pays (set by parent agent)
        parentAgentSubAgentPrice: agentPrice.subAgentPrice, // Minimum price sub-agent must charge
        hasPricing: !!subAgentPrice,
        customerPrice: subAgentPrice?.customerPrice || null,
        createdAt: bundle.createdAt,
        updatedAt: bundle.updatedAt,
      };
    });
};

/**
 * Delete sub-agent price for a bundle
 */
export const deleteSubAgentPrice = async (subAgentId, bundleId) => {
  const prisma = getPrisma();

  // Check if exists
  const existing = await prisma.subAgentPrice.findUnique({
    where: {
      subAgentId_bundleId: {
        subAgentId,
        bundleId,
      },
    },
  });

  if (!existing) {
    throw new AppError("Sub-agent price not found", 404);
  }

  await prisma.subAgentPrice.delete({
    where: {
      subAgentId_bundleId: {
        subAgentId,
        bundleId,
      },
    },
  });

  return { message: "Sub-agent price deleted successfully" };
};

/**
 * Bulk set sub-agent prices for multiple bundles
 */
export const bulkSetSubAgentPrices = async (subAgentId, pricesData) => {
  const results = [];
  const errors = [];

  for (const priceData of pricesData) {
    try {
      const result = await setSubAgentPrice(
        subAgentId,
        priceData.bundleId,
        priceData.customerPrice,
      );
      results.push(result);
    } catch (error) {
      errors.push({
        bundleId: priceData.bundleId,
        error: error.message,
      });
    }
  }

  return {
    success: results.length,
    failed: errors.length,
    results,
    errors,
  };
};
