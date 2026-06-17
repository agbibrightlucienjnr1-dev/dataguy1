import apiClient from "./client";

export const paymentsApi = {
  /**
   * Verify and process payment after Paystack redirect
   * @param {string} reference - Payment/Order reference
   */
  verifyAndProcess: (reference) =>
    apiClient.post(`/payments/verify-and-process/${reference}`),

  /**
   * Verify payment status (check only, no processing)
   * @param {string} reference - Payment reference
   */
  verify: (reference) => apiClient.get(`/payments/verify/${reference}`),

  /**
   * Check payment status for polling
   * This endpoint also triggers verification if payment is detected
   * @param {string} reference - Payment/Order reference
   */
  checkStatus: (reference) =>
    apiClient.get(`/payments/check-status/${reference}`),

  /**
   * Force verify payment (manual retry)
   * @param {string} reference - Payment/Order reference
   */
  forceVerify: (reference) =>
    apiClient.post(`/payments/force-verify/${reference}`),

  /**
   * Verify Moolre OTP
   */
  verifyMoolreOtp: (data) =>
    apiClient.post(`/payments/moolre/verify-otp`, data),

  /**
   * Validate recipient mobile network account name using Moolre (Public)
   */
  validateRecipientName: (data) =>
    apiClient.post(`/payments/moolre/validate-name`, data),
};
