import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache data for 30 minutes
      gcTime: 30 * 60 * 1000,
      // Only retry once on failure
      retry: 1,
      // Don't refetch on window focus by default
      refetchOnWindowFocus: false,
      // Don't refetch on reconnect by default
      refetchOnReconnect: false,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
});

// Query keys factory for consistent key management
export const queryKeys = {
  // Auth
  auth: {
    profile: ["auth", "profile"],
  },

  // Bundles
  bundles: {
    all: ["bundles"],
    list: (params) => ["bundles", "list", params],
    detail: (id) => ["bundles", "detail", id],
    active: ["bundles", "active"],
    byPaymentLink: (code) => ["bundles", "paymentLink", code],
    sellerInfo: (code) => ["bundles", "seller", code],
  },

  // Orders
  orders: {
    all: ["orders"],
    list: (params) => ["orders", "list", params],
    detail: (id) => ["orders", "detail", id],
    stats: ["orders", "stats"],
    track: (orderId) => ["orders", "track", orderId],
    trackByPhone: (phone) => ["orders", "trackByPhone", phone],
  },

  // Wallet
  wallet: {
    balance: ["wallet", "balance"],
    transactions: (params) => ["wallet", "transactions", params],
    summary: ["wallet", "summary"],
  },

  // Withdrawals
  withdrawals: {
    all: ["withdrawals"],
    list: (params) => ["withdrawals", "list", params],
    detail: (id) => ["withdrawals", "detail", id],
    stats: ["withdrawals", "stats"],
    banks: ["withdrawals", "banks"],
  },

  // Pricing
  pricing: {
    agent: ["pricing", "agent"],
    agentBundles: ["pricing", "agentBundles"],
    subAgent: ["pricing", "subAgent"],
    subAgentBundles: ["pricing", "subAgentBundles"],
  },

  // Admin
  admin: {
    dashboard: ["admin", "dashboard"],
    statistics: ["admin", "statistics"],
    users: {
      all: ["admin", "users"],
      list: (params) => ["admin", "users", "list", params],
      detail: (id) => ["admin", "users", "detail", id],
    },
    orders: {
      all: ["admin", "orders"],
      list: (params) => ["admin", "orders", "list", params],
      failed: ["admin", "orders", "failed"],
    },
    wallets: {
      all: ["admin", "wallets"],
      list: (params) => ["admin", "wallets", "list", params],
    },
    withdrawals: {
      all: ["admin", "withdrawals"],
      list: (params) => ["admin", "withdrawals", "list", params],
    },
  },
  customers: {
    list: ["customers"],
  },
};
