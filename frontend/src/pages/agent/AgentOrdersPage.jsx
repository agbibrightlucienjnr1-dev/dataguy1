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
import { Card, Button, Input, Badge, Modal, EmptyState, SkeletonTable, Reveal } from "../../components/ui";
import { useNavigate } from "react-router-dom";
import { ordersApi } from "../../api";
import { formatCurrency, formatDateTime } from "../../utils/formatters";
import { NETWORKS, ORDER_STATUSES } from "../../utils/constants";

export default function AgentOrdersPage() {
  const navigate = useNavigate();
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
      <div className="animate-fade-in-up flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
      <Reveal as={Card} className="p-4">
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
          <div className="flex items-center gap-3 flex-wrap">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
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
              className="h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
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
      </Reveal>

      {/* Orders Table */}
      <Reveal as={Card} delay={100} className="overflow-hidden">
        {isLoading ? (
          <SkeletonTable rows={5} columns={7} />
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="No orders found"
            description="You haven't placed any orders matching your criteria."
            action={{
              label: "Go to Dashboard",
              onClick: () => navigate("/dashboard"),
            }}
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-brand-50/50 border-b border-slate-200">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Order</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Bundle</th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-brand-50/40 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <span className="inline-block font-mono text-xs px-2 py-1 rounded-lg bg-slate-100 text-slate-600">
                          {order.id.slice(0, 8)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-900">
                          {order.customerPhone}
                        </p>
                        {order.customerEmail && (
                          <p className="text-xs text-slate-500">
                            {order.customerEmail}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${getNetworkStyle(
                              order.bundle?.network,
                            )}`}
                          />
                          <span className="text-sm text-slate-800">
                            {order.bundle?.network === "AIRTELTIGO"
                              ? "AT Big Time"
                              : order.bundle?.network === "AT"
                              ? "AT iSHARE"
                              : order.bundle?.network === "TELECEL"
                              ? "Telecel"
                              : "MTN"} <span className="text-slate-500">{order.bundle?.volume}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <p className="text-sm font-bold text-slate-900">
                          {formatCurrency(order.pricePaid)}
                        </p>
                        {order.commissionAmount > 0 && (
                          <p className="text-xs font-medium text-action-600">
                            +{formatCurrency(order.commissionAmount)}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4">
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
                      <td className="px-5 py-4">
                        <p className="text-sm text-slate-500 whitespace-nowrap">
                          {formatDateTime(order.createdAt)}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:bg-brand-100 hover:text-brand-700 transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="lg:hidden divide-y divide-slate-100">
              {filteredOrders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="w-full text-left p-4 hover:bg-brand-50/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{order.customerPhone}</p>
                      <span className="inline-block font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 mt-0.5">
                        {order.id.slice(0, 8)}
                      </span>
                    </div>
                    <Badge
                      variant={
                        order.status === "completed"
                          ? "success"
                          : order.status === "failed" || order.status === "cancelled"
                            ? "danger"
                            : "warning"
                      }
                      className="inline-flex items-center gap-1 shrink-0"
                    >
                      {getStatusIcon(order.status)}
                      {ORDER_STATUSES[order.status]?.label || order.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${getNetworkStyle(order.bundle?.network)}`} />
                      <span className="text-sm text-slate-600">
                        {order.bundle?.network === "AIRTELTIGO"
                          ? "AT Big Time"
                          : order.bundle?.network === "AT"
                          ? "AT iSHARE"
                          : order.bundle?.network === "TELECEL"
                          ? "Telecel"
                          : "MTN"} {order.bundle?.volume}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">{formatCurrency(order.pricePaid)}</p>
                      {order.commissionAmount > 0 && (
                        <p className="text-xs font-medium text-action-600">+{formatCurrency(order.commissionAmount)}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">{formatDateTime(order.createdAt)}</p>
                </button>
              ))}
            </div>
          </>
        )}

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
      </Reveal>

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
                  {formatDateTime(selectedOrder.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Bundle
                </p>
                <p className="text-sm mt-1">
                  {selectedOrder.bundle?.network === "AIRTELTIGO"
                    ? "AT Big Time"
                    : selectedOrder.bundle?.network === "AT"
                    ? "AT iSHARE"
                    : selectedOrder.bundle?.network === "TELECEL"
                    ? "Telecel"
                    : "MTN"} {selectedOrder.bundle?.volume}
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
                <p className="text-sm font-medium text-action-600 mt-1">
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
