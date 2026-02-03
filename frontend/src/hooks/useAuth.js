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
      const errorMessage = getErrorMessage(
        error,
        "Unable to log in. Please check your phone number and password, then try again.",
      );
      toast.error(errorMessage, {
        duration: 5000,
      });
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
      let errorMessage = getErrorMessage(
        error,
        "Unable to create account. Please check all fields and try again.",
      );
      
      // Format multi-line password errors for better display
      if (errorMessage.includes("\n•")) {
        // Replace newlines with spaces for toast display
        errorMessage = errorMessage.replace(/\n•/g, "\n•");
      }
      
      // For password errors, show longer duration to allow reading
      const isPasswordError = errorMessage.includes("password") || 
                             errorMessage.includes("Password") ||
                             errorMessage.includes("must be") ||
                             errorMessage.includes("must contain") ||
                             errorMessage.includes("\n");
      
      toast.error(errorMessage, {
        duration: isPasswordError ? 8000 : 5000,
        style: {
          whiteSpace: 'pre-line', // Allow line breaks in toast
          maxWidth: '500px',
        },
      });
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

/**
 * Hook for changing password
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      toast.success("Password changed successfully!");
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          "Failed to change password. Please try again.",
        ),
      );
    },
  });
}