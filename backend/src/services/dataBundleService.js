import { getPrisma } from "../config/database.js";
import { AppError } from "../middlewares/errorHandler.js";

/**
 * Create a new data bundle (Admin only)
 */
export const createDataBundle = async (bundleData) => {
  const prisma = getPrisma();
  const { network, volume, hubnetCost, adminPrice } = bundleData;

  // Validate prices
  if (parseFloat(hubnetCost) <= 0 || parseFloat(adminPrice) <= 0) {
    throw new AppError("Prices must be greater than zero", 400);
  }

  if (parseFloat(adminPrice) < parseFloat(hubnetCost)) {
    throw new AppError("Admin price cannot be less than Hubnet cost", 400);
  }

  // Check if bundle already exists
  const existing = await prisma.dataBundle.findUnique({
    where: {
      network_volume: {
        network,
        volume,
      },
    },
  });

  if (existing) {
    throw new AppError(`Bundle ${network} ${volume} already exists`, 400);
  }

  // Create bundle
  const bundle = await prisma.dataBundle.create({
    data: {
      network,
      volume,
      hubnetCost,
      adminPrice,
      isActive: true,
    },
  });

  return bundle;
};

/**
 * Get all data bundles (with optional filters)
 */
export const getAllDataBundles = async (filters = {}) => {
  const prisma = getPrisma();
  const { network, isActive } = filters;

  const where = {};
  if (network) where.network = network;
  if (isActive !== undefined) where.isActive = isActive === "true";

  const bundles = await prisma.dataBundle.findMany({
    where,
    orderBy: [{ network: "asc" }, { volume: "asc" }],
  });

  return bundles;
};

/**
 * Get active data bundles only (for customers)
 */
export const getActiveBundles = async (network = null) => {
  const prisma = getPrisma();

  const where = { isActive: true };
  if (network) where.network = network;

  const bundles = await prisma.dataBundle.findMany({
    where,
    orderBy: [{ network: "asc" }, { volume: "asc" }],
  });

  return bundles;
};

/**
 * Get single data bundle by ID
 */
export const getDataBundleById = async (bundleId) => {
  const prisma = getPrisma();

  const bundle = await prisma.dataBundle.findUnique({
    where: { id: bundleId },
  });

  if (!bundle) {
    throw new AppError("Data bundle not found", 404);
  }

  return bundle;
};

/**
 * Update data bundle (Admin only)
 */
export const updateDataBundle = async (bundleId, updateData) => {
  const prisma = getPrisma();

  // Check if bundle exists
  const existing = await getDataBundleById(bundleId);

  // Validate prices if provided
  if (updateData.hubnetCost && parseFloat(updateData.hubnetCost) <= 0) {
    throw new AppError("Hubnet cost must be greater than zero", 400);
  }

  if (updateData.adminPrice && parseFloat(updateData.adminPrice) <= 0) {
    throw new AppError("Admin price must be greater than zero", 400);
  }

  // Check that admin price is not less than hubnet cost
  const newHubnetCost = updateData.hubnetCost || existing.hubnetCost;
  const newAdminPrice = updateData.adminPrice || existing.adminPrice;

  if (parseFloat(newAdminPrice) < parseFloat(newHubnetCost)) {
    throw new AppError("Admin price cannot be less than Hubnet cost", 400);
  }

  // Update bundle
  const bundle = await prisma.dataBundle.update({
    where: { id: bundleId },
    data: updateData,
  });

  return bundle;
};

/**
 * Delete data bundle (Admin only)
 */
export const deleteDataBundle = async (bundleId) => {
  const prisma = getPrisma();

  // Check if bundle exists
  await getDataBundleById(bundleId);

  await prisma.dataBundle.delete({
    where: { id: bundleId },
  });

  return { message: "Data bundle deleted successfully" };
};

/**
 * Toggle bundle active status (Admin only)
 */
export const toggleBundleStatus = async (bundleId, isActive) => {
  const prisma = getPrisma();

  const bundle = await prisma.dataBundle.update({
    where: { id: bundleId },
    data: { isActive },
  });

  return bundle;
};
