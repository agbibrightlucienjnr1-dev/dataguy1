import { useMemo, useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ArrowRight,
  Copy,
  Phone,
  Wifi,
  AlertCircle,
} from "lucide-react";
import { Card, Button, Badge } from "../../components/ui";
import { useTrackOrder } from "../../hooks";
import { paymentsApi } from "../../api";
import { formatCurrency, formatDate } from "../../utils/formatters";
import toast from "react-hot-toast";

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    label: "Pending Payment",
    description: "Waiting for payment confirmation",
  },
  payment_confirmed: {
    icon: CheckCircle,
    color: "text-brand-600",
    bgColor: "bg-brand-100",
    label: "Payment Confirmed",
    description: "Your payment has been received. Delivering data bundle...",
  },
  processing: {
    icon: Loader2,
    color: "text-fuchsia-600",
    bgColor: "bg-fuchsia-100",
    label: "Processing",
    description: "Your data bundle is being delivered",
    animate: true,
  },
  completed: {
    icon: CheckCircle,
    color: "text-action-600",
    bgColor: "bg-action-100",
    label: "Completed",
    description: "Your data bundle has been delivered successfully!",
  },
  failed: {
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-100",
    label: "Failed",
    description:
      "There was an issue delivering your bundle. Please contact support.",
  },
  cancelled: {
    icon: XCircle,
    color: "text-slate-600",
    bgColor: "bg-slate-100",
    label: "Cancelled",
    description: "This order has been cancelled",
  },
};

export default function PaymentCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processError, setProcessError] = useState(null);
  const [hasProcessed, setHasProcessed] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  // Get order ID from URL params using useMemo
  // The reference is the order ID directly
  const orderId = useMemo(() => {
    const reference = searchParams.get("reference");
    const trxref = searchParams.get("trxref");
    return reference || trxref || null;
  }, [searchParams]);

  // Fetch order status
  const { data, isLoading, error, refetch } = useTrackOrder(orderId);
  const order = data?.order;

  // Verify and process payment on mount
  // Only process if order is still pending (webhook might have already processed it)
  useEffect(() => {
    const verifyAndProcess = async () => {
      if (!orderId || hasProcessed) return;

      // First, check the current order status
      // If it's already processed, don't try to process again
      if (order && order.status !== "pending") {
        setHasProcessed(true);
        return;
      }

      setIsProcessing(true);
      setHasProcessed(true);
      try {
        await paymentsApi.verifyAndProcess(orderId);
        // Refetch order after processing
        refetch();
      } catch (err) {
        // If already processed or order status is not pending, that's fine
        const errorMsg = err.message || err.response?.data?.message || "";
        const isAlreadyProcessed =
          errorMsg.includes("already processed") ||
          errorMsg.includes("Order cannot be confirmed") ||
          errorMsg.includes("Unique constraint") ||
          err.response?.status === 200; // Success response even if already processed

        if (!isAlreadyProcessed) {
          setProcessError(
            err.response?.data?.message ||
              err.message ||
              "Failed to process payment",
          );
        }
        // Still refetch to show current status
        refetch();
      } finally {
        setIsProcessing(false);
      }
    };

    // Only process if we have an orderId and haven't processed yet
    // Also wait a bit to let webhook process first if it's coming
    const timeoutId = setTimeout(() => {
      verifyAndProcess();
    }, 500); // Small delay to let webhook process first

    return () => clearTimeout(timeoutId);
  }, [orderId, hasProcessed, refetch, order]);

  // Polling effect - automatically check payment status if order is still pending
  // This catches payments that take longer to process (e.g., customer taking 3+ minutes)
  useEffect(() => {
    if (!orderId || !order || order.status !== "pending") return;

    setIsPolling(true);
    let pollCount = 0;
    const maxPolls = 60; // Poll for up to 5 minutes (60 * 5 seconds)
    const pollInterval = 5000; // Poll every 5 seconds

    const pollPaymentStatus = async () => {
      try {
        const response = await paymentsApi.checkStatus(orderId);
        const statusData = response.data;

        // If payment was just confirmed or status changed, refetch order
        if (statusData.justConfirmed || statusData.status !== "pending") {
          refetch();
          setIsPolling(false);
          return true; // Stop polling
        }
      } catch (err) {
        // Silently ignore polling errors
        console.warn("Polling error:", err.message);
      }
      return false; // Continue polling
    };

    const intervalId = setInterval(async () => {
      pollCount++;
      const shouldStop = await pollPaymentStatus();

      if (shouldStop || pollCount >= maxPolls) {
        clearInterval(intervalId);
        setIsPolling(false);
      }
    }, pollInterval);

    // Initial poll after 3 seconds
    const initialPollTimeout = setTimeout(() => {
      pollPaymentStatus();
    }, 3000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(initialPollTimeout);
      setIsPolling(false);
    };
  }, [orderId, order?.status, refetch]);

  const copyOrderId = () => {
    if (order?.id) {
      navigator.clipboard.writeText(order.id);
      toast.success("Order ID copied!");
    }
  };

  // Processing/Loading state
  if (isProcessing || isLoading || !orderId) {
    return (
      <div className="min-h-screen bg-mesh-navy flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">
            {isProcessing
              ? "Processing your payment..."
              : "Loading order status..."}
          </p>
        </div>
      </div>
    );
  }

  // Error state - only show if order is still pending or not found
  // If order was processed (even if 2nd request failed), show success
  const showError =
    (error || processError) && (!order || order.status === "pending");

  if (showError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 rounded-3xl text-center shadow-lg shadow-red-500/5 border-red-100">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-display font-bold text-slate-900 mb-2">
            {processError ? "Payment Processing Error" : "Order Not Found"}
          </h1>
          <p className="text-slate-600 mb-6">
            {processError ||
              "We couldn't find your order. Please check your order ID or contact support."}
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/track">
              <Button variant="outline">Track Another Order</Button>
            </Link>
            <Link to="/">
              <Button>Go Home</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const status = STATUS_CONFIG[order?.status] || STATUS_CONFIG.pending;
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link to="/" className="text-xl font-display font-bold text-slate-900">
            DataGuy
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        {/* Status Card */}
        <Card
          className={`p-8 rounded-3xl text-center mb-6 ${
            order?.status === "completed"
              ? "border-action-200 shadow-lg shadow-action-500/10"
              : order?.status === "failed"
              ? "border-red-200 shadow-lg shadow-red-500/10"
              : ""
          }`}
        >
          <div
            className={`w-20 h-20 ${status.bgColor} rounded-full flex items-center justify-center mx-auto mb-6`}
          >
            <StatusIcon
              className={`w-10 h-10 ${status.color} ${status.animate ? "animate-spin" : ""}`}
            />
          </div>

          <h1 className="text-2xl font-display font-bold text-slate-900 mb-2">
            {status.label}
          </h1>
          <p className="text-slate-600 mb-6">{status.description}</p>

          {/* Order Details */}
          <div className="bg-slate-50 rounded-2xl p-6 text-left">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-500">Order ID</span>
              <button
                onClick={copyOrderId}
                className="flex items-center gap-2 text-sm font-mono text-slate-900 hover:text-brand-600"
              >
                {order?.id?.slice(0, 12)}...
                <Copy className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <Wifi className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    {order?.bundle?.volume}
                  </p>
                  <p className="text-sm text-slate-500">
                    {order?.bundle?.network} • {order?.bundle?.validity}
                  </p>
                </div>
                <Badge variant="primary" className="ml-auto">
                  {formatCurrency(order?.pricePaid)}
                </Badge>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <Phone className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    {order?.customerPhone}
                  </p>
                  <p className="text-sm text-slate-500">Recipient phone</p>
                </div>
              </div>
            </div>

            {order?.createdAt && (
              <div className="mt-4 pt-4 border-t border-slate-200 text-sm text-slate-500">
                Ordered on {formatDate(order.createdAt)}
              </div>
            )}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={() => refetch()} className="gap-2">
            <Loader2 className="w-4 h-4" />
            Refresh Status
          </Button>
          <Button
            className="gap-2 w-full sm:w-auto"
            onClick={() => navigate(-1)}
          >
            Back
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Help Text */}
        {order?.status === "pending" && (
          <Card className="mt-6 p-4 rounded-2xl bg-amber-50 border-amber-200">
            <div className="flex items-center gap-3 mb-2">
              {isPolling && (
                <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
              )}
              <p className="text-sm font-medium text-amber-800">
                {isPolling
                  ? "Checking payment status..."
                  : "Waiting for payment confirmation"}
              </p>
            </div>
            <p className="text-sm text-amber-700">
              If you've completed the payment, please wait a moment. We're
              verifying your payment with Paystack. This usually takes a few
              seconds.
            </p>
          </Card>
        )}

        {order?.status === "completed" && (
          <Card className="mt-6 p-4 rounded-2xl bg-action-50 border-action-200">
            <p className="text-sm text-action-800 text-center">
              🎉 Your data bundle has been delivered! Check your phone for
              confirmation.
            </p>
          </Card>
        )}

        {order?.status === "failed" && (
          <Card className="mt-6 p-4 rounded-2xl bg-red-50 border-red-200">
            <p className="text-sm text-red-800 text-center">
              If you were charged, please contact support with your Order ID for
              a refund.
            </p>
          </Card>
        )}
      </main>
    </div>
  );
}
