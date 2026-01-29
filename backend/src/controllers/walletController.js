import { asyncHandler } from "../middlewares/errorHandler.js";
import {
  getWalletByUserId,
  getWalletTransactions,
  getWalletSummary,
} from "../services/walletService.js";

/**
 * Get current user's wallet
 * GET /api/wallet
 */
export const getMyWallet = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const wallet = await getWalletByUserId(userId);

  res.status(200).json({
    success: true,
    data: { wallet },
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
