import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores";
import { LoadingScreen } from "../ui";

/**
 * Protects routes that require authentication
 * Redirects to login if not authenticated
 */
export default function RequireAuth({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen message="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    // Save the attempted URL for redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render children if passed, otherwise render Outlet for nested routes
  return children ? children : <Outlet />;
}
