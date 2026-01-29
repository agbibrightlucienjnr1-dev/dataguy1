import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Layouts
import { AuthLayout } from "./components/layout";

// Auth Guards
import { RequireAuth, RequireAdmin, GuestOnly } from "./components/auth";

// Public Pages
import { LandingPage, LoginPage, RegisterPage } from "./pages/public";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth Routes - Only for non-authenticated users */}
        <Route element={<GuestOnly />}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>
        </Route>

        {/* Protected Routes - Require authentication */}
        <Route element={<RequireAuth />}>
          {/* Dashboard will be added here */}
          <Route
            path="/dashboard"
            element={<PlaceholderPage title="Dashboard" />}
          />
          <Route
            path="/orders"
            element={<PlaceholderPage title="My Orders" />}
          />
          <Route
            path="/bundles"
            element={<PlaceholderPage title="Data Bundles" />}
          />
          <Route path="/wallet" element={<PlaceholderPage title="Wallet" />} />
          <Route
            path="/withdrawals"
            element={<PlaceholderPage title="Withdrawals" />}
          />
          <Route
            path="/profile"
            element={<PlaceholderPage title="Profile" />}
          />
          <Route
            path="/pricing"
            element={<PlaceholderPage title="Pricing" />}
          />
        </Route>

        {/* Admin Routes */}
        <Route element={<RequireAdmin />}>
          <Route
            path="/admin"
            element={<PlaceholderPage title="Admin Dashboard" />}
          />
          <Route
            path="/admin/users"
            element={<PlaceholderPage title="Manage Users" />}
          />
          <Route
            path="/admin/orders"
            element={<PlaceholderPage title="All Orders" />}
          />
          <Route
            path="/admin/bundles"
            element={<PlaceholderPage title="Manage Bundles" />}
          />
          <Route
            path="/admin/withdrawals"
            element={<PlaceholderPage title="Manage Withdrawals" />}
          />
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{title}</h1>
        <p className="text-slate-600">This page is coming soon.</p>
      </div>
    </div>
  );
}

export default App;
