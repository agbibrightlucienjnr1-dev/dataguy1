import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Layouts
import { AuthLayout, DashboardLayout } from "./components/layout";

// Auth Guards
import { RequireAuth, RequireAdmin, GuestOnly } from "./components/auth";

// Public Pages
import {
  LandingPage,
  LoginPage,
  RegisterPage,
  BuyPage,
  PaymentCallbackPage,
  OrderTrackingPage,
} from "./pages/public";

// Dashboard Pages
import { DashboardPage, ProfilePage } from "./pages/dashboard";

// Agent Pages
import {
  AgentOrdersPage,
  AgentBundlesPage,
  AgentWalletPage,
  AgentWithdrawalsPage,
  AgentPricingPage,
} from "./pages/agent";

// Admin Pages
import {
  AdminDashboardPage,
  AdminUsersPage,
  AdminOrdersPage,
  AdminBundlesPage,
  AdminWithdrawalsPage,
  AdminSystemPage,
} from "./pages/admin";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/buy/:code" element={<BuyPage />} />
        <Route path="/payment/callback" element={<PaymentCallbackPage />} />
        <Route path="/track" element={<OrderTrackingPage />} />

        {/* Auth Routes - Only for non-authenticated users */}
        <Route element={<GuestOnly />}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/register/:code" element={<RegisterPage />} />
          </Route>
        </Route>

        {/* Protected Routes - Require authentication */}
        <Route element={<RequireAuth />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/orders" element={<AgentOrdersPage />} />
            <Route path="/bundles" element={<AgentBundlesPage />} />
            <Route path="/wallet" element={<AgentWalletPage />} />
            <Route path="/withdrawals" element={<AgentWithdrawalsPage />} />
            <Route path="/pricing" element={<AgentPricingPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Admin Routes */}
        <Route element={<RequireAdmin />}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/orders" element={<AdminOrdersPage />} />
            <Route path="/admin/bundles" element={<AdminBundlesPage />} />
            <Route
              path="/admin/withdrawals"
              element={<AdminWithdrawalsPage />}
            />
            <Route path="/admin/system" element={<AdminSystemPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#1e293b",
            color: "#fff",
          },
          success: {
            iconTheme: {
              primary: "#22c55e",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />
    </BrowserRouter>
  );
}

// Temporary placeholder component for pages we haven't built yet
function PlaceholderPage({ title }) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{title}</h1>
        <p className="text-slate-600">This page is coming soon.</p>
      </div>
    </div>
  );
}

export default App;
