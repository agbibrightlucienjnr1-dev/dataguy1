import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowDownToLine,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Building2,
  Phone,
  AlertTriangle,
} from "lucide-react";
import { Card, Button, Input, Badge, Modal } from "../../components/ui";
import { withdrawalsApi, walletApi } from "../../api";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { MOBILE_MONEY_NETWORKS } from "../../utils/constants";
import toast from "react-hot-toast";

const WITHDRAWAL_STATUSES = {
  pending: { label: "Pending", color: "warning", icon: Clock },
  approved: { label: "Approved", color: "info", icon: Loader2 },
  completed: { label: "Completed", color: "success", icon: CheckCircle },
  rejected: { label: "Rejected", color: "danger", icon: XCircle },
  failed: { label: "Failed", color: "danger", icon: XCircle },
};

// Validation schemas
const bankWithdrawalSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => parseFloat(val) >= 10, "Minimum withdrawal is GHS 10"),
  accountType: z.literal("bank"),
  bankCode: z.string().min(1, "Bank is required"),
  accountNumber: z
    .string()
    .min(10, "Account number must be at least 10 digits")
    .max(16, "Account number is too long"),
  accountName: z.string().min(2, "Account name is required"),
});

const momoWithdrawalSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => parseFloat(val) >= 1, "Minimum withdrawal is GHS 1"),
  accountType: z.literal("mobile_money"),
  mobileNetwork: z.string().min(1, "Network is required"),
  accountNumber: z
    .string()
    .regex(/^0[235]\d{8}$/, "Enter a valid Ghana phone number"),
  accountName: z.string().min(2, "Account name is required"),
});

export default function AgentWithdrawalsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [accountType, setAccountType] = useState("mobile_money");
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const limit = 10;
  const queryClient = useQueryClient();

  // Fetch wallet balance
  const { data: walletData } = useQuery({
    queryKey: ["wallet"],
    queryFn: walletApi.getBalance,
  });

  const balance = walletData?.data?.wallet?.balance || 0;

  // Fetch withdrawals
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["myWithdrawals", page, statusFilter],
    queryFn: () =>
      withdrawalsApi.getMyWithdrawals({
        page,
        limit,
        status: statusFilter || undefined,
      }),
  });

  // Fetch banks for bank withdrawal
  const { data: banksData } = useQuery({
    queryKey: ["banks"],
    queryFn: withdrawalsApi.getBanks,
    enabled: accountType === "bank",
  });

  const withdrawals = data?.data || [];
  const paginationData = data?.pagination || {};
  const pagination = {
    total: paginationData.total || 0,
    pages: paginationData.totalPages || paginationData.pages || 1,
  };
  const banks = banksData?.data || [];

  // Form setup
  const schema =
    accountType === "bank" ? bankWithdrawalSchema : momoWithdrawalSchema;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: "",
      accountType: accountType,
      accountNumber: "",
      accountName: "",
      bankCode: "",
      mobileNetwork: "MTN",
    },
  });

  // Watch amount for validation
  const watchedAmount = watch("amount");

  // Withdraw mutation
  const withdrawMutation = useMutation({
    mutationFn: (data) => {
      const payload = {
        amount: parseFloat(data.amount),
        accountType:
          data.accountType === "bank" ? "bank_account" : "mobile_money",
        accountNumber: data.accountNumber,
        accountName: data.accountName,
      };

      if (data.accountType === "bank") {
        const bank = banks.find((b) => b.code === data.bankCode);
        payload.bankName = bank?.name || "";
        payload.bankCode = data.bankCode;
      } else {
        payload.mobileNetwork = data.mobileNetwork;
      }

      return withdrawalsApi.create(payload);
    },
    onSuccess: () => {
      toast.success("Withdrawal request submitted");
      setShowWithdrawModal(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ["myWithdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to submit withdrawal",
      );
    },
  });

  const onSubmit = (data) => {
    if (parseFloat(data.amount) > balance) {
      toast.error("Insufficient balance");
      return;
    }
    withdrawMutation.mutate(data);
  };

  const getStatusBadge = (status) => {
    const statusInfo =
      WITHDRAWAL_STATUSES[status] || WITHDRAWAL_STATUSES.pending;
    const Icon = statusInfo.icon;
    return (
      <Badge
        variant={statusInfo.color}
        className="inline-flex items-center gap-1"
      >
        <Icon
          className={`w-3 h-3 ${status === "approved" ? "animate-spin" : ""}`}
        />
        {statusInfo.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Withdrawals</h1>
          <p className="text-slate-600 mt-1">
            Request and track your withdrawals
          </p>
        </div>
        <div className="flex items-center gap-3">
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
          <Button onClick={() => setShowWithdrawModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Withdraw
          </Button>
        </div>
      </div>

      {/* Balance Card */}
      <Card className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-300 text-sm mb-1">Available Balance</p>
            <p className="text-3xl font-bold">{formatCurrency(balance)}</p>
          </div>
          <Button
            variant="secondary"
            onClick={() => setShowWithdrawModal(true)}
            className="bg-white text-slate-900 hover:bg-slate-100"
          >
            <ArrowDownToLine className="w-4 h-4 mr-2" />
            Withdraw Funds
          </Button>
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">Filter by status:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          >
            <option value="">All Status</option>
            {Object.entries(WITHDRAWAL_STATUSES).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Withdrawals List */}
      <Card>
        <div className="divide-y divide-slate-100">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              Loading withdrawals...
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <ArrowDownToLine className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              No withdrawals yet
            </div>
          ) : (
            withdrawals.map((withdrawal) => (
              <div
                key={withdrawal.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 cursor-pointer"
                onClick={() => setSelectedWithdrawal(withdrawal)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      withdrawal.accountType === "bank_account"
                        ? "bg-blue-100"
                        : "bg-yellow-100"
                    }`}
                  >
                    {withdrawal.accountType === "bank_account" ? (
                      <Building2 className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Phone className="w-5 h-5 text-yellow-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {withdrawal.accountType === "bank_account"
                        ? withdrawal.bankName
                        : withdrawal.mobileNetwork + " Mobile Money"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {withdrawal.accountNumber} • {withdrawal.accountName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 sm:text-right">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {formatCurrency(withdrawal.amount)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(withdrawal.createdAt)}
                    </p>
                  </div>
                  {getStatusBadge(withdrawal.status)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-100">
            <p className="text-sm text-slate-600">
              Page {page} of {pagination.pages}
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

      {/* Withdraw Modal */}
      <Modal
        isOpen={showWithdrawModal}
        onClose={() => {
          setShowWithdrawModal(false);
          reset();
        }}
        title="Request Withdrawal"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Account Type Toggle */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Withdrawal Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAccountType("mobile_money")}
                className={`p-3 rounded-lg border-2 text-center transition-colors ${
                  accountType === "mobile_money"
                    ? "border-slate-900 bg-slate-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <Phone className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm font-medium">Mobile Money</span>
              </button>
              <button
                type="button"
                onClick={() => setAccountType("bank")}
                className={`p-3 rounded-lg border-2 text-center transition-colors ${
                  accountType === "bank"
                    ? "border-slate-900 bg-slate-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <Building2 className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm font-medium">Bank Transfer</span>
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Amount (GHS)
            </label>
            <Input
              {...register("amount")}
              type="number"
              step="0.01"
              placeholder="Enter amount"
              error={errors.amount?.message}
            />
            <p className="text-xs text-slate-500 mt-1">
              Available: {formatCurrency(balance)}
            </p>
            {watchedAmount && parseFloat(watchedAmount) > balance && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Insufficient balance
              </p>
            )}
          </div>

          {/* Mobile Money Fields */}
          {accountType === "mobile_money" && (
            <>
              <input
                type="hidden"
                {...register("accountType")}
                value="mobile_money"
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Network
                </label>
                <select
                  {...register("mobileNetwork")}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                >
                  {MOBILE_MONEY_NETWORKS.map((network) => (
                    <option key={network} value={network}>
                      {network}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Phone Number
                </label>
                <Input
                  {...register("accountNumber")}
                  placeholder="0241234567"
                  error={errors.accountNumber?.message}
                />
              </div>
            </>
          )}

          {/* Bank Fields */}
          {accountType === "bank" && (
            <>
              <input type="hidden" {...register("accountType")} value="bank" />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Bank
                </label>
                <select
                  {...register("bankCode")}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                >
                  <option value="">Select bank</option>
                  {banks.map((bank) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name}
                    </option>
                  ))}
                </select>
                {errors.bankCode && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.bankCode.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Account Number
                </label>
                <Input
                  {...register("accountNumber")}
                  placeholder="Enter account number"
                  error={errors.accountNumber?.message}
                />
              </div>
            </>
          )}

          {/* Account Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Account Name
            </label>
            <Input
              {...register("accountName")}
              placeholder="Enter account holder name"
              error={errors.accountName?.message}
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowWithdrawModal(false);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={withdrawMutation.isPending}
            >
              {withdrawMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Withdrawal Details Modal */}
      <Modal
        isOpen={!!selectedWithdrawal}
        onClose={() => setSelectedWithdrawal(null)}
        title="Withdrawal Details"
      >
        {selectedWithdrawal && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Amount
                </p>
                <p className="text-lg font-semibold mt-1">
                  {formatCurrency(selectedWithdrawal.amount)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Status
                </p>
                <div className="mt-1">
                  {getStatusBadge(selectedWithdrawal.status)}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Method
                </p>
                <p className="text-sm mt-1">
                  {selectedWithdrawal.accountType === "bank_account"
                    ? "Bank Transfer"
                    : "Mobile Money"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  {selectedWithdrawal.accountType === "bank_account"
                    ? "Bank"
                    : "Network"}
                </p>
                <p className="text-sm mt-1">
                  {selectedWithdrawal.accountType === "bank_account"
                    ? selectedWithdrawal.bankName
                    : selectedWithdrawal.mobileNetwork}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Account Number
                </p>
                <p className="text-sm mt-1">
                  {selectedWithdrawal.accountNumber}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Account Name
                </p>
                <p className="text-sm mt-1">{selectedWithdrawal.accountName}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Requested On
                </p>
                <p className="text-sm mt-1">
                  {formatDate(selectedWithdrawal.createdAt, true)}
                </p>
              </div>
            </div>

            {selectedWithdrawal.rejectionReason && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-600 uppercase tracking-wide">
                  Rejection Reason
                </p>
                <p className="text-sm text-red-800 mt-1">
                  {selectedWithdrawal.rejectionReason}
                </p>
              </div>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setSelectedWithdrawal(null)}
            >
              Close
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
