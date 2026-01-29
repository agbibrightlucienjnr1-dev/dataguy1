import { asyncHandler } from "../middlewares/errorHandler.js";
import {
  createDataBundle,
  getAllDataBundles,
  getActiveBundles,
  getDataBundleById,
  updateDataBundle,
  deleteDataBundle,
  toggleBundleStatus,
} from "../services/dataBundleService.js";
import { AppError } from "../middlewares/errorHandler.js";

/**
 * Create new data bundle (Admin only)
 * POST /api/bundles
 */
export const createBundle = asyncHandler(async (req, res) => {
  const { network, volume, hubnetCost, adminPrice } = req.body;

  // Validate required fields
  if (!network || !volume || !hubnetCost || !adminPrice) {
    throw new AppError(
      "Network, volume, hubnetCost, and adminPrice are required",
      400,
    );
  }

  const bundle = await createDataBundle({
    network,
    volume,
    hubnetCost,
    adminPrice,
  });

  res.status(201).json({
    success: true,
    message: "Data bundle created successfully",
    data: { bundle },
  });
});

/**
 * Get all data bundles (Admin sees all, others see active only)
 * GET /api/bundles
 */
export const getAllBundles = asyncHandler(async (req, res) => {
  const { network, isActive } = req.query;

  let bundles;

  // Admin can see all bundles with filters
  if (req.user.role === "admin") {
    bundles = await getAllDataBundles({ network, isActive });
  } else {
    // Non-admins only see active bundles
    bundles = await getActiveBundles(network);
  }

  res.status(200).json({
    success: true,
    data: { bundles, count: bundles.length },
  });
});

/**
 * Get active bundles only (Public - for customers)
 * GET /api/bundles/active
 */
export const getActiveBundlesOnly = asyncHandler(async (req, res) => {
  const { network } = req.query;

  const bundles = await getActiveBundles(network);

  res.status(200).json({
    success: true,
    data: { bundles, count: bundles.length },
  });
});

/**
 * Get single data bundle by ID
 * GET /api/bundles/:id
 */
export const getBundle = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const bundle = await getDataBundleById(id);

  // Non-admins can only see active bundles
  if (req.user.role !== "admin" && !bundle.isActive) {
    throw new AppError("Data bundle not found", 404);
  }

  res.status(200).json({
    success: true,
    data: { bundle },
  });
});

/**
 * Update data bundle (Admin only)
 * PATCH /api/bundles/:id
 */
export const updateBundle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { network, volume, hubnetCost, adminPrice, isActive } = req.body;

  const updateData = {};
  if (network !== undefined) updateData.network = network;
  if (volume !== undefined) updateData.volume = volume;
  if (hubnetCost !== undefined) updateData.hubnetCost = hubnetCost;
  if (adminPrice !== undefined) updateData.adminPrice = adminPrice;
  if (isActive !== undefined) updateData.isActive = isActive;

  const bundle = await updateDataBundle(id, updateData);

  res.status(200).json({
    success: true,
    message: "Data bundle updated successfully",
    data: { bundle },
  });
});

/**
 * Delete data bundle (Admin only)
 * DELETE /api/bundles/:id
 */
export const deleteBundle = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await deleteDataBundle(id);

  res.status(200).json({
    success: true,
    message: "Data bundle deleted successfully",
  });
});

/**
 * Toggle bundle active status (Admin only)
 * PATCH /api/bundles/:id/toggle
 */
export const toggleBundle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (isActive === undefined) {
    throw new AppError("isActive field is required", 400);
  }

  const bundle = await toggleBundleStatus(id, isActive);

  res.status(200).json({
    success: true,
    message: `Bundle ${isActive ? "activated" : "deactivated"} successfully`,
    data: { bundle },
  });
});
