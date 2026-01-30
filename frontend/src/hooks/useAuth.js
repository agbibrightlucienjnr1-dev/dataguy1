import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { authApi } from "../api";
import { useAuthStore } from "../stores";
import { getErrorMessage } from "../utils/helpers";

/**
 * Hook for handling login
 */
export function useLogin() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (response) => {
      const { user, token } = response.data;
      setAuth(user, token);
      toast.success("Login successful!");

      // Redirect based on role
      if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          "Unable to log in. Please check your credentials.",
        ),
      );
    },
  });
}

/**
 * Hook for handling registration
 */
export function useRegister() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (response) => {
      const { user, token } = response.data;
      setAuth(user, token);
      toast.success("Registration successful!");
      navigate("/dashboard");
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(error, "Unable to create account. Please try again."),
      );
    },
  });
}

/**
 * Hook for handling logout
 */
export function useLogout() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();

  return () => {
    logout();
    queryClient.clear();
    toast.success("Logged out successfully");
    navigate("/login");
  };
}

/**
 * Hook to get current auth state
 */
export function useAuth() {
  const { user, token, isAuthenticated, isLoading } = useAuthStore();

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    isAdmin: user?.role === "admin",
    isAgent: user?.role === "agent",
    isSubAgent: user?.role === "sub_agent",
    paymentLinkCode: user?.paymentLinkCode,
  };
}
