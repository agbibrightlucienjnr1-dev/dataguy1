import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { withdrawalsApi } from "../api";
import { queryKeys } from "../lib";

/**
 * Hook to get Ghana banks list
 */
export function useBanks() {
  return useQuery({
    queryKey: queryKeys.withdrawals.banks,
    queryFn: withdrawalsApi.getBanks,
    select: (response) => response.data,
    staleTime: 60 * 60 * 1000, // Banks list is stable, cache for 1 hour
  });
}

/**
 * Hook to get user's withdrawals
 * @param {Object} params - { status?, page?, limit? }
 */
export function useWithdrawals(params = {}) {
  return useQuery({
    queryKey: queryKeys.withdrawals.list(params),
    queryFn: () => withdrawalsApi.getMyWithdrawals(params),
    select: (response) => ({
      withdrawals: response.data,
      pagination: response.pagination,
    }),
  });
}

/**
 * Hook to get withdrawal by ID
 * @param {string} id - Withdrawal ID
 */
export function useWithdrawal(id) {
  return useQuery({
    queryKey: queryKeys.withdrawals.detail(id),
    queryFn: () => withdrawalsApi.getById(id),
    select: (response) => response.data,
    enabled: !!id,
  });
}

/**
 * Hook to get withdrawal statistics
 */
export function useWithdrawalStats() {
  return useQuery({
    queryKey: queryKeys.withdrawals.stats,
    queryFn: withdrawalsApi.getStats,
    select: (response) => response.data,
  });
}

/**
 * Hook to verify bank account
 */
export function useVerifyAccount() {
  return useMutation({
    mutationFn: withdrawalsApi.verifyAccount,
    onError: (error) => {
      toast.error(error.message || "Failed to verify account");
    },
  });
}

/**
 * Hook to create withdrawal request
 */
export function useCreateWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: withdrawalsApi.create,
    onSuccess: () => {
      toast.success("Withdrawal request created successfully");
      // Invalidate wallet and withdrawals queries
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.balance });
      queryClient.invalidateQueries({ queryKey: queryKeys.withdrawals.all });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create withdrawal");
    },
  });
}
