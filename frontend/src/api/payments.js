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
};
