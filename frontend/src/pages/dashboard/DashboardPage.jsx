import { Link } from "react-router-dom";
import {
  ShoppingCart,
  Wallet,
  TrendingUp,
  ArrowRight,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Copy,
  ExternalLink,
  Users,
} from "lucide-react";
import { Card } from "../../components/ui";
import { useAuthStore } from "../../stores";
import { useOrders, useOrderStats, useWallet } from "../../hooks";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { ORDER_STATUSES } from "../../utils/constants";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: ordersData, isLoading } = useOrders({ limit: 5 });
  const { data: statsData } = useOrderStats();
  const { balance: walletBalance } = useWallet();

  const orders = ordersData?.orders || [];
  const stats = statsData?.stats || {
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
  };

  // Generate payment link for customers
  const paymentLink = user?.paymentLinkCode
    ? `${window.location.origin}/buy/${user.paymentLinkCode}`
    : null;

  // Generate sub-agent registration link (only for agents)
  const subAgentRegistrationLink =
    user?.paymentLinkCode && user?.role === "agent"
      ? `${window.location.origin}/register/${user.paymentLinkCode}`
      : null;

  const copyPaymentLink = () => {
    if (paymentLink) {
      navigator.clipboard.writeText(paymentLink);
      toast.success("Payment link copied!");
    }
  };

  const copySubAgentLink = () => {
    if (subAgentRegistrationLink) {
      navigator.clipboard.writeText(subAgentRegistrationLink);
      toast.success("Sub-agent registration link copied!");
    }
  };

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
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {user?.name?.split(" ")[0]}!
        </h1>
        <p className="text-slate-600 mt-1">
          Here's what's happening with your sales today.
        </p>
      </div>

      {/* Links Section */}
      <div className="space-y-4">
        {/* Customer Payment Link */}
        {paymentLink && (
          <Card className="bg-linear-to-r from-slate-900 to-slate-800 text-white p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ShoppingCart className="w-5 h-5" />
                  <h3 className="font-semibold">Customer Payment Link</h3>
                </div>
                <p className="text-slate-300 text-sm">
                  Share this link with customers to receive payments
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-white/10 rounded-lg px-3 py-2 text-sm font-mono truncate max-w-xs">
                  {paymentLink}
                </div>
                <button
                  onClick={copyPaymentLink}
                  className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                  title="Copy link"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <a
                  href={paymentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                  title="Open link"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </Card>
        )}

        {/* Sub-Agent Registration Link (only for agents) */}
        {subAgentRegistrationLink && (
          <Card className="bg-linear-to-r from-blue-900 to-blue-800 text-white p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-5 h-5" />
                  <h3 className="font-semibold">Sub-Agent Registration Link</h3>
                </div>
                <p className="text-blue-300 text-sm">
                  Share this link to recruit sub-agents under you
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-white/10 rounded-lg px-3 py-2 text-sm font-mono truncate max-w-xs">
                  {subAgentRegistrationLink}
                </div>
                <button
                  onClick={copySubAgentLink}
                  className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                  title="Copy link"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <a
                  href={subAgentRegistrationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                  title="Open link"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Orders</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {stats.totalOrders || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Revenue</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {formatCurrency(stats.totalRevenue || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Wallet Balance</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {formatCurrency(walletBalance || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <Link
            to="/wallet"
            className="text-sm text-slate-600 hover:text-slate-900 mt-3 inline-flex items-center gap-1"
          >
            View wallet <ArrowRight className="w-3 h-3" />
          </Link>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Pending Orders</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {stats.pendingOrders || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/bundles">
          <Card className="p-5 hover:border-slate-300 transition-colors cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-slate-900 transition-colors">
                <Package className="w-6 h-6 text-slate-600 group-hover:text-white transition-colors" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Browse Bundles</h3>
                <p className="text-sm text-slate-500">
                  View available data bundles
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/orders">
          <Card className="p-5 hover:border-slate-300 transition-colors cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-slate-900 transition-colors">
                <ShoppingCart className="w-6 h-6 text-slate-600 group-hover:text-white transition-colors" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">View Orders</h3>
                <p className="text-sm text-slate-500">
                  Track your order history
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/withdrawals">
          <Card className="p-5 hover:border-slate-300 transition-colors cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-slate-900 transition-colors">
                <Wallet className="w-6 h-6 text-slate-600 group-hover:text-white transition-colors" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Withdraw Funds</h3>
                <p className="text-sm text-slate-500">Cash out your earnings</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Recent Orders */}
      <Card>
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Recent Orders</h2>
            <Link
              to="/orders"
              className="text-sm text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-500">
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No orders yet</p>
            <p className="text-sm text-slate-400 mt-1">
              Orders from your payment link will appear here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {orders.map((order) => (
              <div
                key={order.id}
                className="p-4 flex items-center justify-between hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(order.status)}
                  <div>
                    <p className="font-medium text-slate-900">
                      {order.bundle
                        ? `${order.bundle.network} ${order.bundle.volume}`
                        : "Data Bundle"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {order.customerPhone} • {formatDate(order.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-slate-900">
                    {formatCurrency(order.pricePaid)}
                  </p>
                  <p
                    className={`text-xs capitalize ${
                      ORDER_STATUSES[order.status]?.color || "text-slate-500"
                    }`}
                  >
                    {order.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
