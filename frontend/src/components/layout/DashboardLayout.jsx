import { useState } from "react";
import { Outlet, NavLink, Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Wifi,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Wallet,
  ArrowDownToLine,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Tag,
  Users,
  BarChart3,
  RefreshCw,
  Server,
  MessageCircle,
  PlayCircle,
} from "lucide-react";
import { useAuthStore } from "../../stores";
import { useLogout } from "../../hooks";
import { adminApi } from "../../api";
import { formatCurrency } from "../../utils/formatters";

const agentNavGroups = [
  {
    title: "Main",
    items: [{ to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" }],
  },
  {
    title: "Store",
    items: [
      { to: "/bundles", icon: Package, label: "Data Bundles" },
      { to: "/orders", icon: ShoppingCart, label: "My Orders" },
    ],
  },
  {
    title: "Finance",
    items: [
      { to: "/wallet", icon: Wallet, label: "Wallet" },
      { to: "/withdrawals", icon: ArrowDownToLine, label: "Withdrawals" },
      { to: "/pricing", icon: Tag, label: "Pricing Setup" },
    ],
  },
  {
    title: "Network",
    items: [
      { to: "/sub-agents", icon: Users, label: "My Sub-Agents" },
      { to: "/customers", icon: User, label: "My Customers" },
    ],
  },
];

const adminNavGroups = [
  {
    title: "Main",
    items: [{ to: "/admin", icon: LayoutDashboard, label: "Dashboard" }],
  },
  {
    title: "Store",
    items: [
      { to: "/admin/bundles", icon: Package, label: "Bundles" },
      { to: "/admin/orders", icon: ShoppingCart, label: "All Orders" },
    ],
  },
  {
    title: "Finance",
    items: [
      { to: "/admin/withdrawals", icon: ArrowDownToLine, label: "Withdrawals" },
      { to: "/admin/reports", icon: BarChart3, label: "Reports" },
    ],
  },
  {
    title: "Network",
    items: [
      { to: "/admin/users", icon: Users, label: "System Users" },
      { to: "/admin/customers", icon: User, label: "Customers" },
    ],
  },
  {
    title: "Platform",
    items: [
      { to: "/admin/sms", icon: MessageCircle, label: "SMS Notifications" },
      { to: "/admin/system", icon: Server, label: "System Settings" }
    ],
  },
];

function NavGroup({ group, setSidebarOpen }) {
  const { pathname } = useLocation();
  const isGroupActive = group.items.some(
    (item) =>
      item.to === pathname ||
      (item.to !== "/dashboard" && item.to !== "/admin" && pathname.startsWith(item.to))
  );
  const [isOpen, setIsOpen] = useState(isGroupActive);

  return (
    <div className="mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold tracking-wider text-slate-500 uppercase hover:text-slate-300 transition-colors"
      >
        <span>{group.title}</span>
        <ChevronRight
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
        />
      </button>
      
      <div 
        className={`mt-1 space-y-1 overflow-hidden transition-all duration-200 ease-in-out ${
          isOpen ? "max-h-96 opacity-100 visible" : "max-h-0 opacity-0 invisible"
        }`}
      >
        {group.items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/dashboard" || item.to === "/admin"}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <item.icon className={`w-5 h-5 ${pathname === item.to || (item.to !== "/dashboard" && item.to !== "/admin" && pathname.startsWith(item.to)) ? "text-indigo-200" : ""}`} />
            {item.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, isAdmin } = useAuthStore();
  const logout = useLogout();

  const navGroups = isAdmin() ? adminNavGroups : agentNavGroups;

  // Fetch Hubnet balance for admin users
  const {
    data: hubnetBalanceData,
    isLoading: hubnetBalanceLoading,
    refetch: refetchHubnetBalance,
  } = useQuery({
    queryKey: ["admin", "hubnet-balance"],
    queryFn: () => adminApi.getHubnetBalance(),
    enabled: isAdmin(), // Only fetch for admin users
    refetchInterval: 60000, // Refetch every 60 seconds
    retry: 2,
    retryDelay: 3000,
  });

  const hubnetBalance = hubnetBalanceData?.balance || "0.00";

  // Fetch total wallet balance for all agents/sub-agents
  const {
    data: totalWalletBalanceData,
    isLoading: totalWalletBalanceLoading,
    refetch: refetchTotalWalletBalance,
  } = useQuery({
    queryKey: ["admin", "total-wallet-balance"],
    queryFn: () => adminApi.getTotalWalletBalance(),
    enabled: isAdmin(), // Only fetch for admin users
    refetchInterval: 60000, // Refetch every 60 seconds
    retry: 2,
    retryDelay: 3000,
  });

  const totalWalletBalance = totalWalletBalanceData?.totalBalance || "0.00";

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
            <Link
              to={isAdmin() ? "/admin" : "/dashboard"}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <Wifi className="w-5 h-5 text-slate-900" />
              </div>
              <span className="text-lg font-bold text-white">DataGuy</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto style-scrollbar">
            {navGroups.map((group) => (
              <NavGroup key={group.title} group={group} setSidebarOpen={setSidebarOpen} />
            ))}
          </nav>

          {/* User section at bottom */}
          <div className="p-3 border-t border-slate-800 space-y-1">


            {/* WhatsApp Channel Link */}
            <a
              href="https://whatsapp.com/channel/0029Vb7gnkoKbYMFemxIZF2w"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors bg-green-600 hover:bg-green-700 text-white"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="flex-1">Join WhatsApp</span>
              <svg
                className="w-4 h-4 opacity-75"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
            <NavLink
              to="/profile"
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white text-slate-900"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <User className="w-5 h-5" />
              Profile
            </NavLink>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Page title placeholder */}
            <div className="hidden lg:block" />

            {/* Right side */}
            <div className="flex items-center gap-4">
              {/* Total Wallet Balance (Admin only) */}
              {isAdmin() && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <div className="flex flex-col">
                    <span className="text-xs text-emerald-600 leading-none">
                      Total Wallet Balance
                    </span>
                    <span className="text-sm font-semibold text-emerald-900 leading-tight">
                      {totalWalletBalanceLoading ? (
                        <span className="inline-flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Loading...
                        </span>
                      ) : (
                        formatCurrency(totalWalletBalance)
                      )}
                    </span>
                  </div>
                  <button
                    onClick={() => refetchTotalWalletBalance()}
                    className="ml-1 p-1 hover:bg-emerald-100 rounded transition-colors"
                    title="Refresh balance"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 text-emerald-600 ${
                        totalWalletBalanceLoading ? "animate-spin" : ""
                      }`}
                    />
                  </button>
                </div>
              )}

              {/* Hubnet Balance (Admin only) */}
              {isAdmin() && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200">
                  <Wallet className="w-4 h-4 text-slate-600" />
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 leading-none">
                      Hubnet Balance
                    </span>
                    <span className="text-sm font-semibold text-slate-900 leading-tight">
                      {hubnetBalanceLoading ? (
                        <span className="inline-flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Loading...
                        </span>
                      ) : (
                        formatCurrency(hubnetBalance)
                      )}
                    </span>
                  </div>
                  <button
                    onClick={() => refetchHubnetBalance()}
                    className="ml-1 p-1 hover:bg-slate-200 rounded transition-colors"
                    title="Refresh balance"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 text-slate-500 ${
                        hubnetBalanceLoading ? "animate-spin" : ""
                      }`}
                    />
                  </button>
                </div>
              )}

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium text-slate-900">
                      {user?.name}
                    </div>
                    <div className="text-xs text-slate-500 capitalize">
                      {user?.role?.replace("_", " ")}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {/* Dropdown */}
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
