import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api";

// ========== Dashboard & Statistics ==========

export function useAdminDashboard() {
  return useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => adminApi.getDashboard(),
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useAdminStatistics() {
  return useQuery({
    queryKey: ["admin", "statistics"],
    queryFn: () => adminApi.getStatistics(),
    staleTime: 1000 * 60, // 1 minute
  });
}

// ========== Users ==========

export function useAdminUsers(params = {}) {
  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => adminApi.getUsers(params),
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useAdminUser(userId) {
  return useQuery({
    queryKey: ["admin", "users", userId],
    queryFn: () => adminApi.getUserById(userId),
    enabled: !!userId,
    staleTime: 1000 * 30, // 30 seconds
  });
}

// ========== Orders ==========

export function useAdminOrders(params = {}) {
  return useQuery({
    queryKey: ["admin", "orders", params],
    queryFn: () => adminApi.getAllOrders(params),
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useAdminFailedOrders() {
  return useQuery({
    queryKey: ["admin", "orders", "failed"],
    queryFn: () => adminApi.getFailedOrders(),
    staleTime: 1000 * 60, // 1 minute
  });
}

// ========== Bundles ==========

export function useToggleBundleStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }) => adminApi.toggleBundleStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bundles"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "bundles"] });
    },
  });
}

// ========== Wallets ==========

export function useAdminWallets(params = {}) {
  return useQuery({
    queryKey: ["admin", "wallets", params],
    queryFn: () => adminApi.getAllWallets(params),
    staleTime: 1000 * 30, // 30 seconds
  });
}

// ========== Withdrawals ==========

export function useAdminWithdrawals(params = {}) {
  return useQuery({
    queryKey: ["admin", "withdrawals", params],
    queryFn: () => adminApi.getAllWithdrawals(params),
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useApproveWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => adminApi.approveWithdrawal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "withdrawals"] });
    },
  });
}

export function useRejectWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }) => adminApi.rejectWithdrawal(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "withdrawals"] });
    },
  });
}
