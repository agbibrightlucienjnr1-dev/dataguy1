import { asyncHandler } from "../middlewares/errorHandler.js";
import {
  getOrCreateWallet,
  getWalletTransactions,
  getWalletSummary,
} from "../services/walletService.js";
import { getSystemSettings } from "../services/settingsService.js";

/**
 * Get current user's wallet
 * GET /api/wallet
 */
export const getMyWallet = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get or create wallet (creates if doesn't exist)
  const wallet = await getOrCreateWallet(userId);
  const settings = await getSystemSettings();

  res.status(200).json({
    success: true,
    data: { 
      wallet,
      disableWithdrawals: settings.disableWithdrawals
    },
  });
});

/**
 * Get wallet transactions
 * GET /api/wallet/transactions
 */
export const getMyTransactions = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { type, startDate, endDate, page, limit } = req.query;

  const result = await getWalletTransactions(userId, {
    type,
    startDate,
    endDate,
    page: page ? parseInt(page) : undefined,
    limit: limit ? parseInt(limit) : undefined,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * Get wallet summary
 * GET /api/wallet/summary
 */
export const getMySummary = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const summary = await getWalletSummary(userId);

  res.status(200).json({
    success: true,
    data: { summary },
  });
});
