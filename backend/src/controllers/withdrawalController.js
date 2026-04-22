import {
  processAutomaticWithdrawal,
  getUserWithdrawals,
  getAllWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  completeWithdrawalManually,
  getWithdrawalStatistics,
} from "../services/withdrawalService.js";
import { validateAccountName } from "../services/moolreService.js";

/**
 * Create withdrawal request
 */
export const createWithdrawal = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      amount,
      accountNumber,
      accountName,
      mobileNetwork,
    } = req.body;

    // Validate required fields
    if (!amount || !accountNumber || !accountName || !mobileNetwork) {
      return res.status(400).json({
        success: false,
        message:
          "Amount, network, account number, and account name are required",
      });
    }

    const withdrawal = await processAutomaticWithdrawal(userId, {
      amount,
      accountNumber,
      accountName,
      mobileNetwork,
    });

    res.status(201).json({
      success: true,
      message: "Withdrawal request created successfully",
      data: withdrawal,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's withdrawals
 */
export const getMyWithdrawals = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status, page, limit } = req.query;

    const result = await getUserWithdrawals(userId, { status, page, limit });

    res.json({
      success: true,
      data: result.withdrawals,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get withdrawal by ID
 */
export const getWithdrawalById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === "admin";

    const { withdrawals } = await getUserWithdrawals(userId, {});

    const withdrawal = withdrawals.find((w) => w.id === id);

    if (!withdrawal && !isAdmin) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal not found",
      });
    }

    // If admin, fetch from all withdrawals
    if (isAdmin && !withdrawal) {
      const { withdrawals: allWithdrawals } = await getAllWithdrawals({});
      const adminWithdrawal = allWithdrawals.find((w) => w.id === id);

      if (!adminWithdrawal) {
        return res.status(404).json({
          success: false,
          message: "Withdrawal not found",
        });
      }

      return res.json({
        success: true,
        data: adminWithdrawal,
      });
    }

    res.json({
      success: true,
      data: withdrawal,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all withdrawals (admin)
 */
export const getAllWithdrawalsAdmin = async (req, res, next) => {
  try {
    const { status, userId, page, limit } = req.query;

    const result = await getAllWithdrawals({ status, userId, page, limit });

    res.json({
      success: true,
      data: result.withdrawals,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve withdrawal (admin)
 * Query params: ?manual=true for manual processing (skip Paystack)
 */
export const approveWithdrawalRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const manualMode = req.query.manual === "true";

    const withdrawal = await approveWithdrawal(id, adminId, manualMode);

    res.json({
      success: true,
      message: manualMode
        ? "Withdrawal approved for manual processing"
        : "Withdrawal approved and transfer initiated",
      data: withdrawal,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject withdrawal (admin)
 */
export const rejectWithdrawalRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const withdrawal = await rejectWithdrawal(id, adminId, reason);

    res.json({
      success: true,
      message: "Withdrawal rejected",
      data: withdrawal,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Complete withdrawal manually (admin)
 * For withdrawals processed outside Paystack
 */
export const completeWithdrawalManuallyRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const { note } = req.body;

    const withdrawal = await completeWithdrawalManually(id, adminId, note);

    res.json({
      success: true,
      message: "Withdrawal marked as completed",
      data: withdrawal,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get withdrawal statistics
 */
export const getWithdrawalStats = async (req, res, next) => {
  try {
    const userId = req.user.role === "admin" ? null : req.user.id;

    const stats = await getWithdrawalStatistics(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get list of Ghana banks (helper endpoint)
 */
export const getGhanaBanks = async (req, res, next) => {
  try {
    const banks = await getBankList();

    res.json({
      success: true,
      data: banks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resolve account number (verify account details)
 */
export const verifyAccountNumber = async (req, res, next) => {
  try {
    const { accountNumber, mobileNetwork } = req.body;

    if (!accountNumber || !mobileNetwork) {
      return res.status(400).json({
        success: false,
        message: "Account number and mobile network are required",
      });
    }

    const accountDetails = await validateAccountName({ accountNumber, network: mobileNetwork });

    res.json({
      success: true,
      data: accountDetails.data,
    });
  } catch (error) {
    next(error);
  }
};
