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
import cache from "../utils/cache.js";

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

  // Invalidate bundle caches
  cache.delete("bundles:admin:*");
  cache.delete("bundles:active:*");
  cache.delete(`bundles:${bundle.id}`);

  res.status(201).json({
    success: true,
    message: "Data bundle created successfully",
    data: { bundle },
  });
});

/**
 * Get all data bundles (Admin sees all, others see active only)
 * GET /api/bundles
 * Cached for 10 minutes (bundles don't change frequently)
 */
export const getAllBundles = asyncHandler(async (req, res) => {
  const { network, isActive } = req.query;

  // Generate cache key based on user role and filters
  const cacheKey = `bundles:${req.user.role}:${network || "all"}:${isActive || "all"}`;
  const cached = cache.get(cacheKey);

  if (cached) {
    res.setHeader("X-Cache", "HIT");
    return res.status(200).json(cached);
  }

  let bundles;

  // Admin can see all bundles with filters
  if (req.user.role === "admin") {
    bundles = await getAllDataBundles({ network, isActive });
  } else {
    // Non-admins only see active bundles
    bundles = await getActiveBundles(network);
  }

  const response = {
    success: true,
    data: { bundles, count: bundles.length },
  };

  // Cache for 10 minutes (bundles rarely change)
  cache.set(cacheKey, response, 10 * 60 * 1000);
  res.setHeader("X-Cache", "MISS");

  res.status(200).json(response);
});

/**
 * Get active bundles only (Public - for customers)
 * GET /api/bundles/active
 * Cached for 10 minutes
 */
export const getActiveBundlesOnly = asyncHandler(async (req, res) => {
  const { network } = req.query;

  const cacheKey = `bundles:active:${network || "all"}`;
  const cached = cache.get(cacheKey);

  if (cached) {
    res.setHeader("X-Cache", "HIT");
    return res.status(200).json(cached);
  }

  const bundles = await getActiveBundles(network);

  const response = {
    success: true,
    data: { bundles, count: bundles.length },
  };

  // Cache for 10 minutes
  cache.set(cacheKey, response, 10 * 60 * 1000);
  res.setHeader("X-Cache", "MISS");

  res.status(200).json(response);
});

/**
 * Get single data bundle by ID
 * GET /api/bundles/:id
 * Cached for 10 minutes
 */
export const getBundle = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const cacheKey = `bundles:${id}`;
  const cached = cache.get(cacheKey);

  if (cached) {
    // Still check permissions
    if (req.user.role !== "admin" && !cached.data.bundle.isActive) {
      throw new AppError("Data bundle not found", 404);
    }
    res.setHeader("X-Cache", "HIT");
    return res.status(200).json(cached);
  }

  const bundle = await getDataBundleById(id);

  // Non-admins can only see active bundles
  if (req.user.role !== "admin" && !bundle.isActive) {
    throw new AppError("Data bundle not found", 404);
  }

  const response = {
    success: true,
    data: { bundle },
  };

  // Cache for 10 minutes
  cache.set(cacheKey, response, 10 * 60 * 1000);
  res.setHeader("X-Cache", "MISS");

  res.status(200).json(response);
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

  // Invalidate bundle caches
  cache.delete(`bundles:${id}`);
  // Invalidate all bundle list caches (pattern matching would be better, but simple for now)
  const cacheStore = cache.store;
  cacheStore.forEach((_, key) => {
    if (key.startsWith("bundles:")) {
      cache.delete(key);
    }
  });

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

  // Invalidate bundle caches
  cache.delete(`bundles:${id}`);
  const cacheStore = cache.store;
  cacheStore.forEach((_, key) => {
    if (key.startsWith("bundles:")) {
      cache.delete(key);
    }
  });

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

  // Invalidate bundle caches
  cache.delete(`bundles:${id}`);
  const cacheStore = cache.store;
  cacheStore.forEach((_, key) => {
    if (key.startsWith("bundles:")) {
      cache.delete(key);
    }
  });

  res.status(200).json({
    success: true,
    message: `Bundle ${isActive ? "activated" : "deactivated"} successfully`,
    data: { bundle },
  });
});
