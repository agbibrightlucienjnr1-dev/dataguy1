import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Send,
  Loader2,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";
import { Card, Badge, Button, Modal, EmptyState, SkeletonTable } from "../../components/ui";
import { adminApi, paymentsApi } from "../../api";
import { formatCurrency, formatDateTime } from "../../utils/formatters";
import { NETWORKS } from "../../utils/constants";

export default function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [networkFilter, setNetworkFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [statusUpdateValue, setStatusUpdateValue] = useState("");
  const queryClient = useQueryClient();

  const handleOpenOrderModal = (order) => {
    setSelectedOrder(order);
    setStatusUpdateValue(order.status);
    setShowOrderModal(true);
  };

  const { data, isLoading } = useQuery({
    queryKey: [
      "admin",
      "orders",
      { status: statusFilter, network: networkFilter, page },
    ],
    queryFn: () =>
      adminApi.getAllOrders({
        status: statusFilter || undefined,
        network: networkFilter || undefined,
        page,
        limit: 20,
      }),
  });

  // Mutation for fulfilling orders
  const fulfillMutation = useMutation({
    mutationFn: (orderId) => adminApi.fulfillOrder(orderId),
    onSuccess: (data) => {
      toast.success("Order sent to Hubnet! Awaiting delivery confirmation.");
      // Invalidate orders query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      setShowOrderModal(false);
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to fulfill order";

      // Provide user-friendly error messages
      let displayMessage = errorMessage;
      if (errorMessage.includes("insufficient")) {
        displayMessage =
          "Hubnet balance is insufficient. Please top up your Hubnet wallet and try again.";
      } else if (errorMessage.includes("Invalid network")) {
        displayMessage =
          "Invalid network. This bundle's network is not supported by Hubnet.";
      } else if (errorMessage.includes("Invalid volume")) {
        displayMessage =
          "Invalid data volume. Please check the bundle configuration.";
      } else if (errorMessage.includes("HUBNET_API_KEY")) {
        displayMessage =
          "Hubnet API key is not configured. Please contact the administrator.";
      } else if (
        errorMessage.includes("timeout") ||
        errorMessage.includes("ECONNREFUSED")
      ) {
        displayMessage = "Could not connect to Hubnet. Please try again later.";
      }

      toast.error(displayMessage, { duration: 5000 });
    },
  });

  // Mutation for marking orders as completed
  const completeMutation = useMutation({
    mutationFn: (orderId) => adminApi.markOrderCompleted(orderId),
    onSuccess: () => {
      toast.success("Order marked as completed!");
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      setShowOrderModal(false);
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to mark order as completed";
      toast.error(errorMessage, { duration: 5000 });
    },
  });

  // Mutation for updating order status to any status
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }) => adminApi.updateOrderStatus(orderId, status),
    onSuccess: (data) => {
      toast.success("Order status updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      if (data?.data?.order) {
        setSelectedOrder(data.data.order);
        setStatusUpdateValue(data.data.order.status);
      } else if (data?.order) {
        setSelectedOrder(data.order);
        setStatusUpdateValue(data.order.status);
      }
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to update order status";
      toast.error(errorMessage, { duration: 5000 });
    },
  });

  // Mutation for force-verifying payment (for Moolre stuck pending orders)
  const forceVerifyMutation = useMutation({
    mutationFn: (orderId) => paymentsApi.forceVerify(orderId),
    onSuccess: (data) => {
      const result = data?.data;
      if (result?.confirmed) {
        toast.success("Payment verified! Order confirmed and sent to Hubnet.");
      } else if (result?.reason === "Payment not completed") {
        toast("Payment not yet detected by Moolre. Try again in a minute.", { icon: "⏳" });
      } else {
        toast.success(result?.reason || "Verification check complete.");
      }
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Verification failed.");
    },
  });

  // API client returns response.data directly: { success, orders, pagination }
  const orders = data?.orders || [];
  const pagination = data?.pagination || {
    page: 1,
    totalPages: 1,
    total: 0,
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-action-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-amber-500" />;
      case "payment_confirmed":
        return <CheckCircle className="w-4 h-4 text-action-500" />;
      case "processing":
        return <AlertCircle className="w-4 h-4 text-brand-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return <Badge variant="success">Completed</Badge>;
      case "failed":
        return <Badge variant="danger">Failed</Badge>;
      case "pending":
        return <Badge variant="warning">Pending</Badge>;
      case "payment_confirmed":
        return <Badge variant="success">Payment Confirmed</Badge>;
      case "processing":
        return <Badge variant="primary">Processing</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getNetworkBadge = (network) => {
    switch (network) {
      case "MTN":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
            MTN
          </span>
        );
      case "TELECEL":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
            Telecel
          </span>
        );
      case "AT":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded">
            AT iSHARE
          </span>
        );
      case "AIRTELTIGO":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded">
            AT Big Time
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-800 rounded">
            {network}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">All Orders</h1>
          <p className="text-slate-600 mt-1">
            View and manage all orders across the platform
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <ShoppingCart className="w-4 h-4" />
          {pagination.total} total orders
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-600">Filters:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 px-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="payment_confirmed">Payment Confirmed</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
          <select
            value={networkFilter}
            onChange={(e) => {
              setNetworkFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 px-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="">All Networks</option>
            {NETWORKS.map((network) => (
              <option key={network.value} value={network.value}>
                {network.label}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Orders Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <SkeletonTable rows={5} columns={8} />
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon="empty"
            title="No orders found"
            description="There are no orders matching your current filters."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-brand-50/40 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Order</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Bundle</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Recipient</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Seller</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Amount</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Status</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Date</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-slate-50 hover:bg-brand-50/50"
                  >
                    <td className="px-6 py-4">
                      <p className="font-mono text-sm text-slate-900">
                        #{order.id.slice(-8)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getNetworkBadge(order.bundle?.network)}
                        <span className="text-sm text-slate-900">
                          {order.bundle?.volume}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-900">
                        {order.customerPhone}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-900">
                        {order.seller?.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {order.seller?.phone}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-900">
                        {formatCurrency(order.pricePaid)}
                      </span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-500">
                        {formatDateTime(order.createdAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Fulfill button - show for payment_confirmed and failed orders */}
                        {(order.status === "payment_confirmed" ||
                          order.status === "failed") && (
                          <Button
                            variant={
                              order.status === "failed" ? "danger" : "primary"
                            }
                            size="sm"
                            onClick={() => fulfillMutation.mutate(order.id)}
                            disabled={fulfillMutation.isPending}
                            title={
                              order.status === "failed"
                                ? "Retry Order - Send data to customer"
                                : "Fulfill Order - Send data to customer"
                            }
                          >
                            {fulfillMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                        {/* Mark as Completed button - show for non-completed and non-pending orders */}
                        {order.status !== "completed" && order.status !== "pending" && (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => completeMutation.mutate(order.id)}
                            disabled={completeMutation.isPending}
                            title="Mark as Completed - Confirm delivery"
                          >
                            {completeMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenOrderModal(order)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPage((p) => Math.min(pagination.totalPages, p + 1))
                }
                disabled={page === pagination.totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Order Details Modal */}
      <Modal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        title="Order Details"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Order Status Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(selectedOrder.status)}
                <div>
                  <p className="font-mono text-lg font-bold text-slate-900">
                    #{selectedOrder.id.slice(-8)}
                  </p>
                  <p className="text-sm text-slate-500">
                    {formatDateTime(selectedOrder.createdAt)}
                  </p>
                </div>
              </div>
              {getStatusBadge(selectedOrder.status)}
            </div>

            {/* Bundle Info */}
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-500 mb-2">Bundle</p>
              <div className="flex items-center gap-2">
                {getNetworkBadge(selectedOrder.bundle?.network)}
                <span className="text-lg font-semibold text-slate-900">
                  {selectedOrder.bundle?.volume}
                </span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Recipient</p>
                <p className="font-medium text-slate-900">
                  {selectedOrder.customerPhone}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Amount</p>
                <p className="font-medium text-slate-900">
                  {formatCurrency(selectedOrder.pricePaid)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Seller</p>
                <p className="font-medium text-slate-900">
                  {selectedOrder.seller?.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Payment via</p>
                <p className="font-medium text-slate-900 capitalize">
                  {selectedOrder.paymentProvider || "paystack"}
                </p>
              </div>
            </div>

            {/* Transaction Reference */}
            {selectedOrder.paymentReference && (
              <div>
                <p className="text-sm text-slate-500">Payment Reference</p>
                <p className="font-mono text-sm text-slate-900">
                  {selectedOrder.paymentReference}
                </p>
              </div>
            )}

            {/* Hubnet Reference */}
            {selectedOrder.hubnetOrderId && (
              <div>
                <p className="text-sm text-slate-500">Hubnet Reference</p>
                <p className="font-mono text-sm text-slate-900">
                  {selectedOrder.hubnetOrderId}
                </p>
              </div>
            )}

            {/* Error Message */}
            {selectedOrder.status === "failed" &&
              selectedOrder.errorMessage && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm font-medium text-red-800">
                    Error Message
                  </p>
                  <p className="text-sm text-red-600 mt-1">
                    {selectedOrder.errorMessage}
                  </p>
                </div>
              )}

            {/* Force Verify Button - for pending Moolre orders */}
            {selectedOrder.status === "pending" && (
              <div className="pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500 mb-2">
                  If the customer has already paid, click below to check Moolre's status and confirm the order.
                </p>
                <Button
                  variant="outline"
                  className="w-full border-brand-300 text-brand-700 hover:bg-brand-50"
                  onClick={() => forceVerifyMutation.mutate(selectedOrder.id)}
                  disabled={forceVerifyMutation.isPending}
                >
                  {forceVerifyMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Checking Payment...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Force Verify Payment
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Fulfill Order Button - only for payment_confirmed status */}
            {selectedOrder.status === "payment_confirmed" && (
              <div className="pt-4 border-t border-slate-200">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => fulfillMutation.mutate(selectedOrder.id)}
                  disabled={fulfillMutation.isPending}
                >
                  {fulfillMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending Data...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Fulfill Order - Send Data
                    </>
                  )}
                </Button>
                {fulfillMutation.isError && (
                  <p className="text-sm text-red-600 mt-2">
                    Error:{" "}
                    {fulfillMutation.error?.message ||
                      "Failed to fulfill order"}
                  </p>
                )}
              </div>
            )}

            {/* Mark as Completed Button - available for any non-completed, non-pending order */}
            {selectedOrder.status !== "completed" && selectedOrder.status !== "pending" && (
              <div className="pt-4 border-t border-slate-200">
                <Button
                  variant="success"
                  className="w-full text-white"
                  onClick={() => completeMutation.mutate(selectedOrder.id)}
                  disabled={completeMutation.isPending}
                >
                  {completeMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Marking as Completed...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Mark as Completed (Manual Confirm)
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Status Override Control */}
            <div className="pt-4 border-t border-slate-200 space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Admin Status Override
              </label>
              <div className="flex gap-2">
                <select
                  value={statusUpdateValue}
                  onChange={(e) => setStatusUpdateValue(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
                >
                  <option value="pending">Pending</option>
                  <option value="payment_confirmed">Payment Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <Button
                  variant="primary"
                  onClick={() => updateStatusMutation.mutate({ orderId: selectedOrder.id, status: statusUpdateValue })}
                  disabled={updateStatusMutation.isPending || statusUpdateValue === selectedOrder.status}
                >
                  {updateStatusMutation.isPending ? "Saving..." : "Update Status"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
