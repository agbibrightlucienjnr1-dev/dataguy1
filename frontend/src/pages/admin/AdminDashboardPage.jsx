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
} from "lucide-react";
import { Card, EmptyState, SkeletonTable } from "../../components/ui";
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
        return <CheckCircle className="w-4 h-4 text-action-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "pending":
      case "processing":
        return <Clock className="w-4 h-4 text-amber-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-600 mt-1">
          Overview of platform activity and metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-5 rounded-2xl shadow-sm shadow-slate-200/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Users</p>
              <p className="font-display text-2xl font-bold text-slate-900 mt-1">
                {statsLoading ? "..." : stats.totalUsers || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center">
              <Users className="w-6 h-6 text-brand-600" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            {stats.agentCount || 0} agents • {stats.subAgentCount || 0}{" "}
            sub-agents
          </div>
        </Card>

        <Card className="p-5 rounded-2xl shadow-sm shadow-slate-200/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Orders</p>
              <p className="font-display text-2xl font-bold text-slate-900 mt-1">
                {statsLoading ? "..." : stats.totalOrders || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-action-600" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            {stats.completedOrders || 0} completed • {stats.pendingOrders || 0}{" "}
            pending
          </div>
        </Card>

        <Card className="p-5 rounded-2xl shadow-sm shadow-slate-200/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Revenue (This Month)</p>
              <p className="font-display text-2xl font-bold text-slate-900 mt-1">
                {statsLoading ? "..." : formatCurrency(stats.thisMonthRevenue || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-brand-600" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Today: {formatCurrency(stats.todayRevenue || 0)} • Lifetime: {formatCurrency(stats.totalRevenue || 0)}
          </div>
        </Card>

        <Card className="p-5 rounded-2xl shadow-sm shadow-slate-200/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Platform Profit (This Month)</p>
              <p className="font-display text-2xl font-bold text-slate-900 mt-1">
                {statsLoading ? "..." : formatCurrency(stats.thisMonthProfit || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-action-600" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Lifetime Profit: {formatCurrency(stats.platformProfit || 0)}
          </div>
        </Card>

        <Card className="p-5 rounded-2xl shadow-sm shadow-slate-200/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Pending WDs</p>
              <p className="font-display text-2xl font-bold text-slate-900 mt-1">
                {statsLoading ? "..." : stats.pendingWithdrawals || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
              <ArrowDownToLine className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 truncate">
            {formatCurrency(stats.pendingWithdrawalAmount || 0)} pending
          </div>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="rounded-2xl">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-slate-900">Recent Orders</h2>
              <Link
                to="/admin/orders"
                className="text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
                View all →
              </Link>
            </div>
          </div>
          {ordersLoading ? (
            <div className="p-4">
              <SkeletonTable rows={5} columns={2} />
            </div>
          ) : recentOrders.length === 0 ? (
            <EmptyState
              icon="empty"
              title="No recent orders"
              description="New orders will appear here automatically."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 flex items-center justify-between hover:bg-violet-50/50 transition-colors"
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
        <Card className="rounded-2xl">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-slate-900">
                Pending Withdrawals
              </h2>
              <Link
                to="/admin/withdrawals"
                className="text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
                View all →
              </Link>
            </div>
          </div>
          {withdrawalsLoading ? (
            <div className="p-4">
              <SkeletonTable rows={5} columns={2} />
            </div>
          ) : pendingWithdrawals.length === 0 ? (
            <EmptyState
              icon="empty"
              title="No pending withdrawals"
              description="You are fully caught up on payouts."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingWithdrawals.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className="p-4 flex items-center justify-between hover:bg-violet-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-amber-500" />
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
                    <p className="text-xs text-amber-600">Pending</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 text-center rounded-2xl">
          <p className="font-display text-2xl font-bold text-action-600">
            {stats.successRate || 0}%
          </p>
          <p className="text-xs text-slate-500 mt-1">Success Rate</p>
        </Card>
        <Card className="p-4 text-center rounded-2xl">
          <p className="font-display text-2xl font-bold text-slate-900">
            {stats.todayOrders || 0}
          </p>
          <p className="text-xs text-slate-500 mt-1">Orders Today</p>
        </Card>
        <Card className="p-4 text-center rounded-2xl">
          <p className="font-display text-2xl font-bold text-brand-600">
            {stats.activeAgents || 0}
          </p>
          <p className="text-xs text-slate-500 mt-1">Active Agents</p>
        </Card>
        <Card className="p-4 text-center rounded-2xl">
          <p className="font-display text-2xl font-bold text-red-600">
            {stats.failedOrders || 0}
          </p>
          <p className="text-xs text-slate-500 mt-1">Failed Orders</p>
        </Card>
      </div>
    </div>
  );
}
