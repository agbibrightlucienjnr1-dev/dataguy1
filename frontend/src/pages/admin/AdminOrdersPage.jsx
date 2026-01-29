import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
} from "lucide-react";
import { Card, Badge, Button, Modal } from "../../components/ui";
import { adminApi } from "../../api";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { NETWORKS } from "../../utils/constants";

export default function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [networkFilter, setNetworkFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

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
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "processing":
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
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
      case "AirtelTigo":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
            AirtelTigo
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
            className="h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
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
            className="h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
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
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left p-4 text-sm font-medium text-slate-500">
                  Order
                </th>
                <th className="text-left p-4 text-sm font-medium text-slate-500">
                  Bundle
                </th>
                <th className="text-left p-4 text-sm font-medium text-slate-500">
                  Recipient
                </th>
                <th className="text-left p-4 text-sm font-medium text-slate-500">
                  Seller
                </th>
                <th className="text-left p-4 text-sm font-medium text-slate-500">
                  Amount
                </th>
                <th className="text-left p-4 text-sm font-medium text-slate-500">
                  Status
                </th>
                <th className="text-left p-4 text-sm font-medium text-slate-500">
                  Date
                </th>
                <th className="text-right p-4 text-sm font-medium text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-slate-50 hover:bg-slate-50"
                  >
                    <td className="p-4">
                      <p className="font-mono text-sm text-slate-900">
                        #{order.id.slice(-8)}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getNetworkBadge(order.bundle?.network)}
                        <span className="text-sm text-slate-900">
                          {order.bundle?.volume}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-slate-900">
                        {order.recipientPhone}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-slate-900">
                        {order.seller?.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {order.seller?.phone}
                      </p>
                    </td>
                    <td className="p-4">
                      <span className="font-medium text-slate-900">
                        {formatCurrency(order.amount)}
                      </span>
                    </td>
                    <td className="p-4">{getStatusBadge(order.status)}</td>
                    <td className="p-4">
                      <span className="text-sm text-slate-500">
                        {formatDate(order.createdAt)}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowOrderModal(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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
                    {formatDate(selectedOrder.createdAt)}
                  </p>
                </div>
              </div>
              {getStatusBadge(selectedOrder.status)}
            </div>

            {/* Bundle Info */}
            <div className="p-4 bg-slate-50 rounded-lg">
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
                  {selectedOrder.recipientPhone}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Amount</p>
                <p className="font-medium text-slate-900">
                  {formatCurrency(selectedOrder.amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Seller</p>
                <p className="font-medium text-slate-900">
                  {selectedOrder.seller?.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Seller Phone</p>
                <p className="font-medium text-slate-900">
                  {selectedOrder.seller?.phone}
                </p>
              </div>
            </div>

            {/* Transaction Reference */}
            {selectedOrder.paystackReference && (
              <div>
                <p className="text-sm text-slate-500">Payment Reference</p>
                <p className="font-mono text-sm text-slate-900">
                  {selectedOrder.paystackReference}
                </p>
              </div>
            )}

            {/* Hubnet Reference */}
            {selectedOrder.hubnetReference && (
              <div>
                <p className="text-sm text-slate-500">Hubnet Reference</p>
                <p className="font-mono text-sm text-slate-900">
                  {selectedOrder.hubnetReference}
                </p>
              </div>
            )}

            {/* Error Message */}
            {selectedOrder.status === "failed" &&
              selectedOrder.errorMessage && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-800">
                    Error Message
                  </p>
                  <p className="text-sm text-red-600 mt-1">
                    {selectedOrder.errorMessage}
                  </p>
                </div>
              )}
          </div>
        )}
      </Modal>
    </div>
  );
}
