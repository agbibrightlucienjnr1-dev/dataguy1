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
  MessageCircle,
  Sparkles,
  Tag,
  ChevronRight,
  Phone,
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
  const { data: statsData, isLoading: statsLoading } = useOrderStats();
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
          {stats.totalOrders === 0
            ? `Welcome${user?.name ? `, ${user.name.split(" ")[0]}` : ""}! Let's get you set up.`
            : `Welcome back, ${user?.name?.split(" ")[0]}!`
          }
        </h1>
        <p className="text-slate-600 mt-1">
          {stats.totalOrders === 0
            ? "Complete these quick steps to start making sales and earning commissions."
            : "Here's what's happening with your sales today."
          }
        </p>
      </div>

      {/* Getting Started Guide for New Users */}
      {!statsLoading && stats.totalOrders === 0 && (
        <Card className="border border-indigo-100 overflow-hidden p-0 mb-6 bg-white shadow-sm">
          <div className="bg-linear-to-r from-indigo-600 to-blue-600 p-5 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-indigo-50" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Getting Started Guide</h2>
                <p className="text-indigo-100 text-sm">Complete these steps to start earning</p>
              </div>
            </div>
          </div>
          <div className="p-0 divide-y divide-slate-100">
            <div className="p-4 sm:p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm mt-0.5">1</div>
              <div className="flex-grow">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">Copy & Share Your Link <Copy className="w-4 h-4 text-slate-400" /></h3>
                <p className="text-sm text-slate-600 mt-1">Copy your unique customer payment link below and share it with friends and customers.</p>
                <div className="mt-3 flex items-center gap-2 sm:gap-3 flex-wrap">
                  <div className="bg-slate-100 text-slate-800 rounded px-3 py-1.5 text-xs sm:text-sm font-mono truncate max-w-[200px] sm:max-w-xs border border-slate-200">
                    {paymentLink}
                  </div>
                  <button onClick={copyPaymentLink} className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs">
                    <Copy className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Copy Link</span><span className="sm:hidden">Copy</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm mt-0.5">2</div>
              <div className="flex-grow">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">Set Your Custom Prices <Tag className="w-4 h-4 text-slate-400" /></h3>
                <p className="text-sm text-slate-600 mt-1">Visit the pricing page to configure your selling prices and maximize your commission.</p>
                <Link to="/pricing" className="mt-3 inline-flex items-center gap-1.5 text-sm bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-1.5 rounded-lg transition-colors shadow-xs">
                  Go to Pricing <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="p-4 sm:p-5 flex items-start gap-4 bg-slate-50/50">
              <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-dashed border-slate-300 text-slate-400 flex items-center justify-center font-bold text-sm mt-0.5">3</div>
              <div className="flex-grow">
                <h3 className="font-semibold text-slate-500">Wait For Your First Sale</h3>
                <p className="text-sm text-slate-400 mt-1">Once a customer clicks your link and pays, this guide will disappear and your dashboard will come alive!</p>
              </div>
            </div>
          </div>
        </Card>
      )}



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

        {/* USSD Agent Code */}
        {user?.agentCode && (
          <Card className="bg-linear-to-r from-indigo-900 to-indigo-800 text-white p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Phone className="w-5 h-5" />
                  <h3 className="font-semibold">USSD Code</h3>
                </div>
                <p className="text-indigo-200 text-sm">
                  USSD code coming soon!
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-white/10 rounded-lg px-4 py-2 text-xl font-bold font-mono tracking-widest truncate max-w-xs">
                  {user.agentCode}
                </div>
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
          <div className="p-10 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No orders yet</h3>
            <p className="text-slate-500 mt-1 max-w-sm mx-auto">
              Share your payment link with customers to get your first order! It will automatically appear here.
            </p>
            {paymentLink && (
              <button
                onClick={copyPaymentLink}
                className="mt-6 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm hover:shadow-md cursor-pointer"
              >
                <Copy className="w-4 h-4" /> Copy My Link
              </button>
            )}
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
                    className={`text-xs capitalize ${ORDER_STATUSES[order.status]?.color || "text-slate-500"
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
