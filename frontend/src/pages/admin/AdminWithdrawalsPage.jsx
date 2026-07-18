import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  ArrowDownToLine,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
} from "lucide-react";
import { Card, Badge, Button, Modal, EmptyState, SkeletonTable } from "../../components/ui";
import { adminApi } from "../../api";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { getErrorMessage } from "../../utils/helpers";

export default function AdminWithdrawalsPage() {
  const [statusFilter, setStatusFilter] = useState("pending");
  const [page, setPage] = useState(1);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState(null); // 'approve', 'reject', or 'complete'
  const [rejectionReason, setRejectionReason] = useState("");
  const [useManualMode, setUseManualMode] = useState(true); // Default to manual mode since Paystack payout not available
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "withdrawals", { status: statusFilter, page }],
    queryFn: () =>
      adminApi.getAllWithdrawals({
        status: statusFilter || undefined,
        page,
        limit: 20,
      }),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, manual }) => adminApi.approveWithdrawal(id, manual),
    onSuccess: (_, variables) => {
      toast.success(
        variables.manual
          ? "Withdrawal approved for manual processing"
          : "Withdrawal approved and transfer initiated",
      );
      queryClient.invalidateQueries({ queryKey: ["admin", "withdrawals"] });
      setShowModal(false);
      setSelectedWithdrawal(null);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          "Unable to approve withdrawal. Please try again.",
        ),
      );
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id) => adminApi.completeWithdrawal(id),
    onSuccess: () => {
      toast.success("Withdrawal marked as completed");
      queryClient.invalidateQueries({ queryKey: ["admin", "withdrawals"] });
      setShowModal(false);
      setSelectedWithdrawal(null);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          "Unable to mark withdrawal as complete. Please try again.",
        ),
      );
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => adminApi.rejectWithdrawal(id, reason),
    onSuccess: () => {
      toast.success("Withdrawal rejected");
      queryClient.invalidateQueries({ queryKey: ["admin", "withdrawals"] });
      setShowModal(false);
      setSelectedWithdrawal(null);
      setRejectionReason("");
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          "Unable to reject withdrawal. Please try again.",
        ),
      );
    },
  });

  // Backend returns { success, data: withdrawals[], pagination }
  // API client returns response.data directly
  const withdrawals = data?.data || [];
  const pagination = data?.pagination || {
    page: 1,
    totalPages: 1,
    total: 0,
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return <Badge variant="success">Completed</Badge>;
      case "rejected":
        return <Badge variant="danger">Rejected</Badge>;
      case "pending":
        return <Badge variant="warning">Pending</Badge>;
      case "processing":
        return <Badge variant="primary">Processing</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const handleApprove = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setActionType("approve");
    setShowModal(true);
  };

  const handleReject = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setActionType("reject");
    setRejectionReason("");
    setShowModal(true);
  };

  const handleComplete = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setActionType("complete");
    setShowModal(true);
  };

  const confirmAction = () => {
    if (!selectedWithdrawal) return;

    if (actionType === "approve") {
      approveMutation.mutate({
        id: selectedWithdrawal.id,
        manual: useManualMode,
      });
    } else if (actionType === "reject") {
      rejectMutation.mutate({
        id: selectedWithdrawal.id,
        reason: rejectionReason,
      });
    } else if (actionType === "complete") {
      completeMutation.mutate(selectedWithdrawal.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Withdrawals</h1>
          <p className="text-slate-600 mt-1">
            Manage and process agent withdrawal requests
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <ArrowDownToLine className="w-4 h-4" />
          {pagination.total} total withdrawals
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-600">Status:</span>
          </div>
          <div className="flex gap-2">
            {["pending", "processing", "completed", "rejected", ""].map(
              (status) => (
                <Button
                  key={status || "all"}
                  variant={statusFilter === status ? "primary" : "outline"}
                  size="sm"
                  onClick={() => {
                    setStatusFilter(status);
                    setPage(1);
                  }}
                >
                  {status === ""
                    ? "All"
                    : status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ),
            )}
          </div>
        </div>
      </Card>

      {/* Withdrawals Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <SkeletonTable rows={5} columns={6} />
          </div>
        ) : withdrawals.length === 0 ? (
          <EmptyState
            icon="empty"
            title="No withdrawals found"
            description="There are currently no withdrawal requests matching your filters."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">User</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Requested</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Charges</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Net Payout</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Account Details</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Status</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Date</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {withdrawals.map((withdrawal) => (
                  <tr
                    key={withdrawal.id}
                    className="border-b border-slate-50 hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {withdrawal.user?.name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {withdrawal.user?.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {withdrawal.user?.phone}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-500 font-medium">
                        {formatCurrency(withdrawal.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-500 font-medium">
                        {formatCurrency(withdrawal.fee || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-lg font-bold text-slate-900">
                        {formatCurrency(parseFloat(withdrawal.amount) - parseFloat(withdrawal.fee || 0))}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-900">
                        {withdrawal.accountName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {withdrawal.accountNumber} • {withdrawal.provider}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(withdrawal.status)}
                        {getStatusBadge(withdrawal.status)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-500">
                        {formatDate(withdrawal.createdAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {withdrawal.status === "pending" ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleApprove(withdrawal)}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReject(withdrawal)}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : withdrawal.status === "processing" ? (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleComplete(withdrawal)}
                        >
                          Mark Complete
                        </Button>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
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

      {/* Approval/Rejection/Complete Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedWithdrawal(null);
          setRejectionReason("");
        }}
        title={
          actionType === "approve"
            ? "Approve Withdrawal"
            : actionType === "complete"
              ? "Complete Withdrawal"
              : "Reject Withdrawal"
        }
      >
        {selectedWithdrawal && (
          <div className="space-y-6">
            {/* Withdrawal Details */}
            <div className="p-4 bg-slate-50 rounded-lg space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-500">User:</span>
                <span className="font-medium text-slate-900">
                  {selectedWithdrawal.user?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Requested Amount:</span>
                <span className="font-medium text-slate-900">
                  {formatCurrency(selectedWithdrawal.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Network Charges:</span>
                <span className="font-medium text-slate-900">
                  {formatCurrency(selectedWithdrawal.fee || 0)}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="text-slate-700 font-semibold">Net Payout Amount:</span>
                <span className="font-bold text-lg text-emerald-600">
                  {formatCurrency(parseFloat(selectedWithdrawal.amount) - parseFloat(selectedWithdrawal.fee || 0))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Account:</span>
                <span className="font-medium text-slate-900">
                  {selectedWithdrawal.accountNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Account Name:</span>
                <span className="font-medium text-slate-900">
                  {selectedWithdrawal.accountName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Provider:</span>
                <span className="font-medium text-slate-900">
                  {selectedWithdrawal.provider}
                </span>
              </div>
            </div>

            {actionType === "approve" ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800">
                    Approve this withdrawal request. The user's wallet will be
                    debited.
                  </p>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useManualMode}
                      onChange={(e) => setUseManualMode(e.target.checked)}
                      className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <p className="font-medium text-amber-800">
                        Manual Processing Mode
                      </p>
                      <p className="text-sm text-amber-700">
                        Transfer funds manually (outside the system). Click
                        "Mark Complete" after you've sent the money.
                      </p>
                    </div>
                  </label>
                </div>
                {!useManualMode && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      ⚠️ Automatic Paystack transfer requires a Registered
                      Business account.
                    </p>
                  </div>
                )}
              </div>
            ) : actionType === "complete" ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800">
                  Confirm that you have transferred the funds to the user's
                  account. This will mark the withdrawal as completed.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800">
                    Please provide a reason for rejecting this withdrawal
                    request. The amount will be returned to the user's wallet.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Rejection Reason
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter the reason for rejection..."
                    className="w-full h-24 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 resize-none"
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowModal(false);
                  setSelectedWithdrawal(null);
                  setRejectionReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant={actionType === "reject" ? "danger" : "primary"}
                className="flex-1"
                onClick={confirmAction}
                disabled={
                  (actionType === "reject" && !rejectionReason.trim()) ||
                  approveMutation.isPending ||
                  rejectMutation.isPending ||
                  completeMutation.isPending
                }
              >
                {approveMutation.isPending ||
                rejectMutation.isPending ||
                completeMutation.isPending
                  ? "Processing..."
                  : actionType === "approve"
                    ? useManualMode
                      ? "Approve (Manual)"
                      : "Approve & Transfer"
                    : actionType === "complete"
                      ? "Mark Complete"
                      : "Reject Withdrawal"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
