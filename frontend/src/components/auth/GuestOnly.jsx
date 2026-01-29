import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../stores";

/**
 * Redirects authenticated users away from auth pages
 * (e.g., login/register when already logged in)
 */
export default function GuestOnly({ children }) {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated) {
    // Redirect based on role
    if (user?.role === "admin") {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  // Render children if passed, otherwise render Outlet for nested routes
  return children ? children : <Outlet />;
}
