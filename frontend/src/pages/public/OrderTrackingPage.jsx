import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Search,
  Phone,
  Hash,
  Loader2,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Wifi,
  Copy,
  RefreshCw,
} from "lucide-react";
import { Card, Button, Input, Badge } from "../../components/ui";
import { useTrackOrder, useTrackOrdersByPhone } from "../../hooks";
import { paymentsApi } from "../../api";
import { formatCurrency, formatDate } from "../../utils/formatters";
import toast from "react-hot-toast";

// Validation schemas
const orderIdSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
});

const phoneSchema = z.object({
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(
      /^0[2-9]\d{8}$/,
      "Enter a valid Ghana phone number (e.g., 0241234567)",
    ),
});

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
    label: "Pending",
  },
  payment_confirmed: {
    icon: CheckCircle,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    label: "Paid",
  },
  processing: {
    icon: Loader2,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    label: "Processing",
    animate: true,
  },
  completed: {
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-100",
    label: "Completed",
  },
  failed: {
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-100",
    label: "Failed",
  },
  cancelled: {
    icon: XCircle,
    color: "text-slate-600",
    bgColor: "bg-slate-100",
    label: "Cancelled",
  },
};

export default function OrderTrackingPage() {
  const navigate = useNavigate();
  const [searchType, setSearchType] = useState("phone"); // "phone" or "orderId"
  const [searchQuery, setSearchQuery] = useState("");
  const [searchPhone, setSearchPhone] = useState("");

  // Form for order ID search
  const orderIdForm = useForm({
    resolver: zodResolver(orderIdSchema),
    defaultValues: { orderId: "" },
  });

  // Form for phone search
  const phoneForm = useForm({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "" },
  });

  // Track single order
  const {
    data: orderData,
    isLoading: orderLoading,
    error: orderError,
    refetch: refetchOrder,
  } = useTrackOrder(searchQuery);

  // Track by phone
  const {
    data: phoneData,
    isLoading: phoneLoading,
    error: phoneError,
    refetch: refetchPhone,
  } = useTrackOrdersByPhone(searchPhone);

  const handleOrderIdSearch = (data) => {
    setSearchPhone("");
    setSearchQuery(data.orderId);
  };

  const handlePhoneSearch = (data) => {
    setSearchQuery("");
    setSearchPhone(data.phone);
  };

  const copyOrderId = (id) => {
    navigator.clipboard.writeText(id);
    toast.success("Order ID copied!");
  };

  // Handle refetch after verification
  const handleRefetch = useCallback(() => {
    if (searchQuery) {
      refetchOrder();
    } else if (searchPhone) {
      refetchPhone();
    }
  }, [searchQuery, searchPhone, refetchOrder, refetchPhone]);

  const order = orderData?.order;
  const orders = phoneData?.orders || [];

  const isLoading = orderLoading || phoneLoading;
  const hasSearched = searchQuery || searchPhone;
  const hasResults = order || orders.length > 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-xl font-bold text-slate-900">
              DataGuy
            </Link>
            <button
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate("/");
                }
              }}
              className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Track Your Order
          </h1>
          <p className="text-slate-600">
            Enter your order ID or phone number to check your order status
          </p>
        </div>

        {/* Search Type Toggle */}
        <div className="flex bg-slate-100 rounded-lg p-1 mb-6">
          <button
            onClick={() => setSearchType("phone")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              searchType === "phone"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Phone className="w-4 h-4 inline-block mr-2" />
            By Phone
          </button>
          <button
            onClick={() => setSearchType("orderId")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              searchType === "orderId"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Hash className="w-4 h-4 inline-block mr-2" />
            By Order ID
          </button>
        </div>

        {/* Search Forms */}
        <Card className="p-6 mb-6">
          {searchType === "phone" ? (
            <form
              onSubmit={phoneForm.handleSubmit(handlePhoneSearch)}
              className="flex gap-3"
            >
              <div className="flex-1">
                <Input
                  placeholder="Enter your phone number (e.g., 0241234567)"
                  icon={Phone}
                  error={phoneForm.formState.errors.phone?.message}
                  {...phoneForm.register("phone")}
                />
              </div>
              <Button type="submit" disabled={phoneLoading} className="gap-2">
                {phoneLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Search
              </Button>
            </form>
          ) : (
            <form
              onSubmit={orderIdForm.handleSubmit(handleOrderIdSearch)}
              className="flex gap-3"
            >
              <div className="flex-1">
                <Input
                  placeholder="Enter your order ID"
                  icon={Hash}
                  error={orderIdForm.formState.errors.orderId?.message}
                  {...orderIdForm.register("orderId")}
                />
              </div>
              <Button type="submit" disabled={orderLoading} className="gap-2">
                {orderLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Search
              </Button>
            </form>
          )}
        </Card>

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin mx-auto mb-2" />
            <p className="text-slate-500">Searching...</p>
          </div>
        )}

        {/* No Results / Not Found */}
        {hasSearched &&
          !isLoading &&
          !hasResults &&
          (orderError?.status === 404 ||
            phoneError?.status === 404 ||
            (!orderError && !phoneError)) && (
            <Card className="p-8 text-center">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">
                {orderError?.status === 404 || phoneError?.status === 404
                  ? "No orders found. Please check your search criteria."
                  : "No orders found. Please check your search criteria."}
              </p>
            </Card>
          )}

        {/* Error (non-404 errors) */}
        {(orderError || phoneError) &&
          orderError?.status !== 404 &&
          phoneError?.status !== 404 && (
            <Card className="p-8 text-center">
              <XCircle className="w-12 h-12 text-red-300 mx-auto mb-4" />
              <p className="text-slate-600">
                {orderError?.message ||
                  phoneError?.message ||
                  "An error occurred"}
              </p>
            </Card>
          )}

        {/* Single Order Result */}
        {order && !isLoading && (
          <OrderCard
            order={order}
            onCopy={copyOrderId}
            onRefetch={handleRefetch}
          />
        )}

        {/* Multiple Orders Result */}
        {orders.length > 0 && !isLoading && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Found {orders.length} order{orders.length > 1 ? "s" : ""}
            </p>
            {orders.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                onCopy={copyOrderId}
                onRefetch={handleRefetch}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// Order Card Component
function OrderCard({ order, onCopy, onRefetch }) {
  const [isVerifying, setIsVerifying] = useState(false);
  const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = status.icon;

  const handleVerifyPayment = async () => {
    setIsVerifying(true);
    try {
      const response = await paymentsApi.forceVerify(order.id || order.orderId);
      const data = response.data;

      if (
        data.message?.includes("confirmed") ||
        data.message?.includes("processed")
      ) {
        toast.success("Payment verified successfully!");
        onRefetch?.();
      } else {
        toast.error("Payment not found. Please complete your payment first.");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      if (
        errorMsg.includes("already processed") ||
        errorMsg.includes("Already")
      ) {
        toast.success("Order already processed!");
        onRefetch?.();
      } else if (errorMsg.includes("not completed")) {
        toast.error("Payment not completed yet. Please complete your payment.");
      } else {
        toast.error(errorMsg || "Verification failed. Please try again.");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <button
            onClick={() => onCopy(order.id || order.orderId || "")}
            className="flex items-center gap-2 text-sm font-mono text-slate-600 hover:text-slate-900"
          >
            {(order.id || order.orderId || "").slice(0, 16)}...
            <Copy className="w-3 h-3" />
          </button>
          <p className="text-sm text-slate-500 mt-1">
            {formatDate(order.createdAt)}
          </p>
        </div>
        <Badge className={status.bgColor}>
          <StatusIcon
            className={`w-3 h-3 mr-1 ${status.color} ${status.animate ? "animate-spin" : ""}`}
          />
          {status.label}
        </Badge>
      </div>

      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
          <Wifi className="w-5 h-5 text-slate-600" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-slate-900">{order.bundle?.volume}</p>
          <p className="text-sm text-slate-500">
            {order.bundle?.network} • {order.customerPhone}
          </p>
        </div>
        <p className="font-semibold text-slate-900">
          {formatCurrency(order.pricePaid)}
        </p>
      </div>

      {order.status === "pending" && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800 mb-3">
            If you've already paid, click the button below to verify your
            payment.
          </p>
          <Button
            variant="warning"
            size="sm"
            onClick={handleVerifyPayment}
            disabled={isVerifying}
            className="w-full gap-2"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Verify Payment
              </>
            )}
          </Button>
        </div>
      )}

      {order.status === "completed" && (
        <p className="text-sm text-green-600 mt-3">
          ✓ Data bundle delivered successfully
        </p>
      )}

      {order.status === "failed" && (
        <p className="text-sm text-red-600 mt-3">
          Order failed. Please contact support if you need assistance.
        </p>
      )}
    </Card>
  );
}
