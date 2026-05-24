import { getPrisma } from "../config/database.js";
import { AppError } from "../middlewares/errorHandler.js";
import { getDataBundleById } from "./dataBundleService.js";

/**
 * Set or update agent pricing for a bundle
 */
export const setAgentPrice = async (agentId, bundleId, priceData) => {
  const prisma = getPrisma();
  let { customerPrice, subAgentPrice } = priceData;

  // Get bundle to check admin price
  const bundle = await getDataBundleById(bundleId);

  // Check if agent price already exists
  const existing = await prisma.agentPrice.findUnique({
    where: {
      agentId_bundleId: {
        agentId,
        bundleId,
      },
    },
  });

  // Resolve missing price fields to existing price or admin default
  if (customerPrice === undefined || customerPrice === null) {
    customerPrice = existing ? parseFloat(existing.customerPrice) : parseFloat(bundle.adminPrice);
  } else {
    customerPrice = parseFloat(customerPrice);
  }

  if (subAgentPrice === undefined || subAgentPrice === null) {
    subAgentPrice = existing ? parseFloat(existing.subAgentPrice) : parseFloat(bundle.adminPrice);
  } else {
    subAgentPrice = parseFloat(subAgentPrice);
  }

  // Validate prices
  if (customerPrice <= 0 || subAgentPrice <= 0) {
    throw new AppError("Prices must be greater than zero", 400);
  }

  if (subAgentPrice > customerPrice) {
    throw new AppError(
      "Sub-agent price cannot be higher than customer price",
      400,
    );
  }

  // Validate that agent prices are >= admin price
  if (customerPrice < parseFloat(bundle.adminPrice)) {
    throw new AppError(
      `Customer price must be at least GH₵ ${bundle.adminPrice} (admin price)`,
      400,
    );
  }

  if (subAgentPrice < parseFloat(bundle.adminPrice)) {
    throw new AppError(
      `Sub-agent price must be at least GH₵ ${bundle.adminPrice} (admin price)`,
      400,
    );
  }

  let agentPrice;

  if (existing) {
    // Update existing price
    agentPrice = await prisma.agentPrice.update({
      where: {
        agentId_bundleId: {
          agentId,
          bundleId,
        },
      },
      data: {
        customerPrice,
        subAgentPrice,
      },
      include: {
        bundle: true,
      },
    });
  } else {
    // Create new price
    agentPrice = await prisma.agentPrice.create({
      data: {
        agentId,
        bundleId,
        customerPrice,
        subAgentPrice,
      },
      include: {
        bundle: true,
      },
    });
  }

  return agentPrice;
};

/**
 * Get all agent prices for a specific agent
 */
export const getAgentPrices = async (agentId) => {
  const prisma = getPrisma();

  const prices = await prisma.agentPrice.findMany({
    where: { agentId },
    include: {
      bundle: true,
    },
    orderBy: [{ bundle: { network: "asc" } }, { bundle: { volume: "asc" } }],
  });

  return prices;
};

/**
 * Get agent price for a specific bundle
 */
export const getAgentPriceForBundle = async (agentId, bundleId) => {
  const prisma = getPrisma();

  const agentPrice = await prisma.agentPrice.findUnique({
    where: {
      agentId_bundleId: {
        agentId,
        bundleId,
      },
    },
    include: {
      bundle: true,
    },
  });

  if (!agentPrice) {
    throw new AppError("Agent price not found for this bundle", 404);
  }

  return agentPrice;
};

/**
 * Get all bundles with agent's pricing (if set)
 * Shows admin price for bundles without agent pricing
 */
export const getBundlesWithAgentPricing = async (agentId) => {
  const prisma = getPrisma();

  // Get all active bundles
  const bundles = await prisma.dataBundle.findMany({
    where: { isActive: true },
    include: {
      agentPrices: {
        where: { agentId },
      },
    },
    orderBy: [{ network: "asc" }, { volume: "asc" }],
  });

  // Format response with pricing info
  return bundles.map((bundle) => {
    const agentPrice = bundle.agentPrices[0];

    return {
      id: bundle.id,
      network: bundle.network,
      volume: bundle.volume,
      adminPrice: bundle.adminPrice,
      isActive: bundle.isActive,
      hasPricing: !!agentPrice,
      customerPrice: agentPrice?.customerPrice || null,
      subAgentPrice: agentPrice?.subAgentPrice || null,
      createdAt: bundle.createdAt,
      updatedAt: bundle.updatedAt,
    };
  });
};

/**
 * Delete agent price for a bundle
 */
export const deleteAgentPrice = async (agentId, bundleId) => {
  const prisma = getPrisma();

  // Check if exists
  const existing = await prisma.agentPrice.findUnique({
    where: {
      agentId_bundleId: {
        agentId,
        bundleId,
      },
    },
  });

  if (!existing) {
    throw new AppError("Agent price not found", 404);
  }

  await prisma.agentPrice.delete({
    where: {
      agentId_bundleId: {
        agentId,
        bundleId,
      },
    },
  });

  return { message: "Agent price deleted successfully" };
};

/**
 * Bulk set agent prices for multiple bundles
 */
export const bulkSetAgentPrices = async (agentId, pricesData) => {
  const prisma = getPrisma();
  const results = [];
  const errors = [];

  for (const priceData of pricesData) {
    try {
      const result = await setAgentPrice(agentId, priceData.bundleId, {
        customerPrice: priceData.customerPrice,
        subAgentPrice: priceData.subAgentPrice,
      });
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
