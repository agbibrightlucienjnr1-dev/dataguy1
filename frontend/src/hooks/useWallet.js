import { useQuery } from "@tanstack/react-query";
import { walletApi } from "../api";
import { queryKeys } from "../lib";

/**
 * Hook to get wallet balance
 */
export function useWalletBalance() {
  return useQuery({
    queryKey: queryKeys.wallet.balance,
    queryFn: walletApi.getBalance,
    select: (response) => response.data?.wallet,
  });
}

/**
 * Hook to get wallet transactions
 * @param {Object} params - { type?, status?, page?, limit? }
 */
export function useWalletTransactions(params = {}) {
  return useQuery({
    queryKey: queryKeys.wallet.transactions(params),
    queryFn: () => walletApi.getTransactions(params),
    select: (response) => ({
      transactions: response.data,
      pagination: response.pagination,
    }),
  });
}

/**
 * Hook to get wallet summary
 */
export function useWalletSummary() {
  return useQuery({
    queryKey: queryKeys.wallet.summary,
    queryFn: walletApi.getSummary,
    select: (response) => response.data,
  });
}

/**
 * Combined hook for wallet data
 */
export function useWallet() {
  const balanceQuery = useWalletBalance();

  return {
    balance: balanceQuery.data?.balance || "0.00",
    totalEarned: balanceQuery.data?.totalEarned || "0.00",
    totalWithdrawn: balanceQuery.data?.totalWithdrawn || "0.00",
    isLoading: balanceQuery.isLoading,
    isError: balanceQuery.isError,
    error: balanceQuery.error,
    refetch: balanceQuery.refetch,
  };
}
