import { useQuery } from "@tanstack/react-query";
import {
  Users,
  ShoppingCart,
  Wallet,
  TrendingUp,
  ArrowDownToLine,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageCircle,
} from "lucide-react";
import { Card } from "../../components/ui";
import { adminApi } from "../../api";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { Link } from "react-router-dom";

export default function AdminDashboardPage() {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["admin", "statistics"],
    queryFn: () => adminApi.getStatistics(),
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["admin", "orders", { limit: 5 }],
    queryFn: () => adminApi.getAllOrders({ limit: 5 }),
  });

  const { data: withdrawalsData, isLoading: withdrawalsLoading } = useQuery({
    queryKey: ["admin", "withdrawals", { status: "pending", limit: 5 }],
    queryFn: () => adminApi.getAllWithdrawals({ status: "pending", limit: 5 }),
  });

  // API client returns response.data directly
  // Statistics: { success, data: { overview, revenueByNetwork, topSellers } }
  const stats = statsData?.data?.overview || {};
  // Orders: { success, orders, pagination }
  const recentOrders = ordersData?.orders || [];
  // Withdrawals: { success, data: withdrawals[], pagination }
  const pendingWithdrawals = withdrawalsData?.data || [];

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "pending":
      case "processing":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-600 mt-1">
          Overview of platform activity and metrics
        </p>
      </div>

      {/* WhatsApp Channel Banner */}
      <Card className="bg-linear-to-r from-green-600 to-green-500 text-white p-4 sm:p-6 border-0 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-base sm:text-lg mb-1">
                Join Our WhatsApp Channel
              </h3>
              <p className="text-green-50 text-xs sm:text-sm leading-relaxed">
                Get instant updates on new features, promotions, system
                announcements, and important notifications
              </p>
            </div>
          </div>
          <a
            href="https://whatsapp.com/channel/0029Vb7gnkoKbYMFemxIZF2w"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-green-600 hover:bg-green-50 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg whitespace-nowrap"
          >
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            Join Now
            <svg
              className="w-4 h-4"
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
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Users</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {statsLoading ? "..." : stats.totalUsers || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            {stats.agentCount || 0} agents • {stats.subAgentCount || 0}{" "}
            sub-agents
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Orders</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {statsLoading ? "..." : stats.totalOrders || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            {stats.completedOrders || 0} completed • {stats.pendingOrders || 0}{" "}
            pending
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Revenue</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {statsLoading ? "..." : formatCurrency(stats.totalRevenue || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Today: {formatCurrency(stats.todayRevenue || 0)}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Pending Withdrawals</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {statsLoading ? "..." : stats.pendingWithdrawals || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
              <ArrowDownToLine className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            {formatCurrency(stats.pendingWithdrawalAmount || 0)} to process
          </div>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Recent Orders</h2>
              <Link
                to="/admin/orders"
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                View all →
              </Link>
            </div>
          </div>
          {ordersLoading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : recentOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No orders yet</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 flex items-center justify-between hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(order.status)}
                    <div>
                      <p className="font-medium text-slate-900 text-sm">
                        {order.bundle?.network} {order.bundle?.volume}
                      </p>
                      <p className="text-xs text-slate-500">
                        {order.seller?.name} • {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-900 text-sm">
                      {formatCurrency(order.pricePaid)}
                    </p>
                    <p className="text-xs text-slate-500 capitalize">
                      {order.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Pending Withdrawals */}
        <Card>
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">
                Pending Withdrawals
              </h2>
              <Link
                to="/admin/withdrawals"
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                View all →
              </Link>
            </div>
          </div>
          {withdrawalsLoading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : pendingWithdrawals.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No pending withdrawals
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingWithdrawals.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className="p-4 flex items-center justify-between hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-yellow-500" />
                    <div>
                      <p className="font-medium text-slate-900 text-sm">
                        {withdrawal.user?.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {withdrawal.accountName} •{" "}
                        {formatDate(withdrawal.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-900 text-sm">
                      {formatCurrency(withdrawal.amount)}
                    </p>
                    <p className="text-xs text-yellow-600">Pending</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600">
            {stats.successRate || 0}%
          </p>
          <p className="text-xs text-slate-500 mt-1">Success Rate</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">
            {stats.todayOrders || 0}
          </p>
          <p className="text-xs text-slate-500 mt-1">Orders Today</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">
            {stats.activeAgents || 0}
          </p>
          <p className="text-xs text-slate-500 mt-1">Active Agents</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-red-600">
            {stats.failedOrders || 0}
          </p>
          <p className="text-xs text-slate-500 mt-1">Failed Orders</p>
        </Card>
      </div>
    </div>
  );
}
