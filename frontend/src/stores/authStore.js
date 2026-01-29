import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      setAuth: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        }),

      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      setLoading: (isLoading) => set({ isLoading }),

      // Computed getters
      isAdmin: () => get().user?.role === "admin",
      isAgent: () => get().user?.role === "agent",
      isSubAgent: () => get().user?.role === "sub_agent",
      getPaymentLinkCode: () => get().user?.paymentLinkCode,
      getUserRole: () => get().user?.role,
    }),
    {
      name: "dataguy-auth",
      // Only persist user and token
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
