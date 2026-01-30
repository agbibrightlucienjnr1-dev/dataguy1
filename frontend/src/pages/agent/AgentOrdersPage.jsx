import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingCart,
  Search,
  Filter,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { Card, Button, Input, Badge, Modal } from "../../components/ui";
import { ordersApi } from "../../api";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { NETWORKS, ORDER_STATUSES } from "../../utils/constants";

export default function AgentOrdersPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [networkFilter, setNetworkFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const limit = 10;

  // Fetch orders
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["myOrders", page, statusFilter, networkFilter],
    queryFn: () =>
      ordersApi.getMyOrders({
        page,
        limit,
        status: statusFilter || undefined,
        network: networkFilter || undefined,
      }),
  });

  const orders = data?.data?.orders || [];
  const paginationData = data?.data?.pagination || {};
  const pagination = {
    total: paginationData.total || 0,
    pages: paginationData.totalPages || paginationData.pages || 1,
  };

  // Filter by search locally
  const filteredOrders = searchQuery
    ? orders.filter(
        (order) =>
          order.customerPhone?.includes(searchQuery) ||
          order.id?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : orders;

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "failed":
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      case "processing":
        return <Loader2 className="w-4 h-4 animate-spin" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getNetworkStyle = (network) => {
    const networkData = NETWORKS.find((n) => n.value === network);
    return networkData?.color || "bg-slate-500";
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>
          <p className="text-slate-600 mt-1">
            Track and manage your customer orders
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by phone or order ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            >
              <option value="">All Status</option>
              {Object.entries(ORDER_STATUSES).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
            <select
              value={networkFilter}
              onChange={(e) => {
                setNetworkFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            >
              <option value="">All Networks</option>
              {NETWORKS.map((network) => (
                <option key={network.value} value={network.value}>
                  {network.label}
                </option>
              ))}
            </select>
          </div>
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
                  Customer
                </th>
                <th className="text-left p-4 text-sm font-medium text-slate-500">
                  Bundle
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
                <th className="text-left p-4 text-sm font-medium text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    No orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-slate-50 hover:bg-slate-50"
                  >
                    <td className="p-4">
                      <p className="font-mono text-sm text-slate-900">
                        {order.id.slice(0, 8)}...
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-slate-900">
                        {order.customerPhone}
                      </p>
                      {order.customerEmail && (
                        <p className="text-xs text-slate-500">
                          {order.customerEmail}
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${getNetworkStyle(
                            order.bundle?.network,
                          )}`}
                        />
                        <span className="text-sm text-slate-900">
                          {order.bundle?.network} {order.bundle?.volume}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-slate-900">
                        {formatCurrency(order.pricePaid)}
                      </p>
                      {order.commissionAmount > 0 && (
                        <p className="text-xs text-green-600">
                          +{formatCurrency(order.commissionAmount)} earned
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={
                          order.status === "completed"
                            ? "success"
                            : order.status === "failed" ||
                                order.status === "cancelled"
                              ? "danger"
                              : "warning"
                        }
                        className="inline-flex items-center gap-1"
                      >
                        {getStatusIcon(order.status)}
                        {ORDER_STATUSES[order.status]?.label || order.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-slate-600">
                        {formatDate(order.createdAt)}
                      </p>
                    </td>
                    <td className="p-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedOrder(order)}
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
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-100">
            <p className="text-sm text-slate-600">
              Page {page} of {pagination.pages} ({pagination.total} orders)
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
                  setPage((p) => Math.min(pagination.pages, p + 1))
                }
                disabled={page === pagination.pages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Order Details Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title="Order Details"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Order ID
                </p>
                <p className="font-mono text-sm mt-1">{selectedOrder.id}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Status
                </p>
                <Badge
                  variant={
                    selectedOrder.status === "completed"
                      ? "success"
                      : selectedOrder.status === "failed"
                        ? "danger"
                        : "warning"
                  }
                  className="mt-1"
                >
                  {ORDER_STATUSES[selectedOrder.status]?.label ||
                    selectedOrder.status}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Customer Phone
                </p>
                <p className="text-sm mt-1">{selectedOrder.customerPhone}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Date
                </p>
                <p className="text-sm mt-1">
                  {formatDate(selectedOrder.createdAt, true)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Bundle
                </p>
                <p className="text-sm mt-1">
                  {selectedOrder.bundle?.network} {selectedOrder.bundle?.volume}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Amount Paid
                </p>
                <p className="text-sm font-medium mt-1">
                  {formatCurrency(selectedOrder.pricePaid)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Your Commission
                </p>
                <p className="text-sm font-medium text-green-600 mt-1">
                  {formatCurrency(selectedOrder.commissionAmount || 0)}
                </p>
              </div>
              {selectedOrder.hubnetOrderId && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">
                    Hubnet Reference
                  </p>
                  <p className="font-mono text-sm mt-1">
                    {selectedOrder.hubnetOrderId}
                  </p>
                </div>
              )}
            </div>

            {selectedOrder.failureReason && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-600 uppercase tracking-wide">
                  Failure Reason
                </p>
                <p className="text-sm text-red-800 mt-1">
                  {selectedOrder.failureReason}
                </p>
              </div>
            )}

            <div className="pt-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSelectedOrder(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
