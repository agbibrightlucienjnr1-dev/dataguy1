import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../stores";
import { LoadingScreen } from "../ui";

/**
 * Protects routes that require admin role
 * Redirects to dashboard if not admin
 */
export default function RequireAdmin({ children }) {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return <LoadingScreen message="Checking permissions..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  // Render children if passed, otherwise render Outlet for nested routes
  return children ? children : <Outlet />;
}
