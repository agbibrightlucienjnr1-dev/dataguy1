import { getPrisma } from "../config/database.js";
import { logger } from "../utils/logger.js";

/**
 * Get the current system settings (or create defaults if they don't exist)
 */
export const getSystemSettings = async () => {
  const prisma = getPrisma();
  
  let settings = await prisma.systemSettings.findUnique({
    where: { id: "global" }
  });

  if (!settings) {
    settings = await prisma.systemSettings.create({
      data: {
        id: "global",
        activePaymentProvider: "paystack",
        moolreFeePercentage: 5.0,
        moolreFlatFee: 0.5,
        paystackFeePercentage: 1.95,
        paystackFlatFee: 0.0
      }
    });
  }

  return settings;
};

/**
 * Get active payment provider specifically
 */
export const getActivePaymentProvider = async () => {
  const settings = await getSystemSettings();
  return settings.activePaymentProvider;
};

/**
 * Update system settings
 */
export const updateSystemSettings = async (updates) => {
  const prisma = getPrisma();
  
  // Ensure default exists first
  await getSystemSettings();

  const allowedFields = [
    "activePaymentProvider", 
    "moolreFeePercentage", 
    "moolreFlatFee", 
    "paystackFeePercentage", 
    "paystackFlatFee"
  ];
  const dataToUpdate = {};
  
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      dataToUpdate[field] = updates[field];
    }
  }

  if (Object.keys(dataToUpdate).length === 0) {
    return getSystemSettings();
  }

  const updatedSettings = await prisma.systemSettings.update({
    where: { id: "global" },
    data: dataToUpdate
  });

  logger.info("System settings updated", dataToUpdate);
  return updatedSettings;
};
