import { asyncHandler } from "../middlewares/errorHandler.js";
import { getSystemSettings, updateSystemSettings } from "../services/settingsService.js";

/**
 * Get all system settings
 * GET /api/settings
 */
export const getSettings = asyncHandler(async (req, res) => {
  const settings = await getSystemSettings();
  res.status(200).json({
    success: true,
    data: settings,
  });
});

/**
 * Update system settings
 * PUT /api/settings
 */
export const updateSettings = asyncHandler(async (req, res) => {
  const updatedSettings = await updateSystemSettings(req.body);
  res.status(200).json({
    success: true,
    message: "Settings updated successfully",
    data: updatedSettings,
  });
});
