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
  Phone,
  AlertTriangle,
} from "lucide-react";
import { Card, Button, Input, Badge, Modal, EmptyState } from "../../components/ui";
import { withdrawalsApi, walletApi } from "../../api";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { MOBILE_MONEY_NETWORKS } from "../../utils/constants";
import { getErrorMessage } from "../../utils/helpers";
import toast from "react-hot-toast";

const WITHDRAWAL_STATUSES = {
  pending: { label: "Pending", color: "warning", icon: Clock },
  processing: { label: "Processing", color: "info", icon: Loader2 },
  completed: { label: "Completed", color: "success", icon: CheckCircle },
  rejected: { label: "Rejected", color: "danger", icon: XCircle },
  failed: { label: "Failed", color: "danger", icon: XCircle },
};

// Validation schema
const momoWithdrawalSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => parseFloat(val) >= 10, "Minimum withdrawal is GHS 10"),
  mobileNetwork: z.string().min(1, "Network is required"),
  accountNumber: z
    .string()
    .regex(/^0[235]\d{8}$/, "Enter a valid Ghana phone number"),
  accountName: z.string().min(2, "Account name must be verified"),
});

export default function AgentWithdrawalsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedName, setVerifiedName] = useState("");

  const limit = 10;
  const queryClient = useQueryClient();

  // Fetch wallet balance
  const { data: walletData } = useQuery({
    queryKey: ["wallet"],
    queryFn: walletApi.getBalance,
  });

  const balance = walletData?.data?.wallet?.balance || 0;
  const disableWithdrawals = walletData?.data?.disableWithdrawals || false;

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

  const withdrawals = data?.data || [];
  const paginationData = data?.pagination || {};
  const pagination = {
    total: paginationData.total || 0,
    pages: paginationData.totalPages || paginationData.pages || 1,
  };

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(momoWithdrawalSchema),
    defaultValues: {
      amount: "",
      accountNumber: "",
      accountName: "",
      mobileNetwork: "MTN",
    },
  });

  // Withdraw mutation
  const withdrawMutation = useMutation({
    mutationFn: (data) => {
      const payload = {
        amount: parseFloat(data.amount),
        accountNumber: data.accountNumber,
        accountName: data.accountName,
        mobileNetwork: data.mobileNetwork,
      };
      return withdrawalsApi.create(payload);
    },
    onSuccess: () => {
      toast.success("Withdrawal automatically processed");
      setShowWithdrawModal(false);
      reset();
      setVerifiedName("");
      queryClient.invalidateQueries({ queryKey: ["myWithdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          "Unable to process withdrawal request. Please check your details and try again.",
        ),
      );
    },
  });

  const verifyAccountName = async () => {
    const { accountNumber, mobileNetwork } = getValues();
    if (!accountNumber || !mobileNetwork) {
       toast.error("Please enter network and phone number first");
       return;
    }
    
    // Quick regex validation
    if (!(/^0[235]\d{8}$/.test(accountNumber))) {
       toast.error("Valid 10-digit number required");
       return;
    }

    try {
       setIsVerifying(true);
       setVerifiedName("");
       setValue("accountName", "");
       const res = await withdrawalsApi.verifyAccount({ accountNumber, mobileNetwork });
       if (res.data?.accountName) {
          setVerifiedName(res.data.accountName);
          setValue("accountName", res.data.accountName, { shouldValidate: true });
          toast.success("Name verified successfully");
       } else {
          toast.error("Could not verify name");
       }
    } catch (err) {
       toast.error(getErrorMessage(err, "Failed to verify account name"));
    } finally {
       setIsVerifying(false);
    }
  };

  const onSubmit = (data) => {
    if (parseFloat(data.amount) > balance) {
      toast.error("You don't have enough balance for this withdrawal.");
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
          className={`w-3 h-3 ${status === "processing" ? "animate-spin" : ""}`}
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
          <Button onClick={() => setShowWithdrawModal(true)} disabled={disableWithdrawals}>
            <Plus className="w-4 h-4 mr-2" />
            Withdraw
          </Button>
        </div>
      </div>

      {disableWithdrawals && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-semibold text-amber-800 text-sm">Withdrawals Disabled</h4>
            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
              Withdrawals are temporarily disabled due to current network disruptions. You cannot request new payouts at this time.
            </p>
          </div>
        </div>
      )}

      {/* Balance Card */}
      <Card className="p-6 bg-linear-to-br from-slate-900 to-slate-800 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-300 text-sm mb-1">Available Balance</p>
            <p className="text-3xl font-bold">{formatCurrency(balance)}</p>
          </div>
          <Button
            variant="secondary"
            onClick={() => setShowWithdrawModal(true)}
            className="bg-white text-slate-900 hover:bg-slate-100"
            disabled={disableWithdrawals}
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
             <div className="space-y-0 divide-y divide-slate-100">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full h-[72px]">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse"></div>
                       <div className="flex flex-col gap-2">
                          <div className="w-24 h-4 bg-slate-200 animate-pulse rounded"></div>
                          <div className="w-40 h-3 bg-slate-200 animate-pulse rounded"></div>
                       </div>
                    </div>
                    <div className="flex items-center gap-4 sm:justify-end">
                       <div className="flex flex-col gap-2 items-end">
                         <div className="w-16 h-5 bg-slate-200 animate-pulse rounded"></div>
                         <div className="w-12 h-3 bg-slate-200 animate-pulse rounded"></div>
                       </div>
                       <div className="w-20 h-6 bg-slate-200 animate-pulse rounded-full"></div>
                    </div>
                  </div>
                ))}
             </div>
          ) : withdrawals.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={ArrowDownToLine}
                title="No withdrawals yet"
                description="You haven't requested any withdrawals yet."
                action={{
                  label: "Withdraw Funds",
                  onClick: () => setShowWithdrawModal(true),
                }}
              />
            </div>
          ) : (
            withdrawals.map((withdrawal) => (
              <div
                key={withdrawal.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 cursor-pointer"
                onClick={() => setSelectedWithdrawal(withdrawal)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-yellow-100">
                    <Phone className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {withdrawal.mobileNetwork} Mobile Money
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
          setVerifiedName("");
        }}
        title="Request Auto-Withdrawal"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <p className="text-sm text-slate-600 pb-2 border-b border-slate-100">
            Your withdrawal will be processed instantly via Mobile Money.
          </p>

          {/* Mobile Money Fields */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Network
            </label>
            <select
              {...register("mobileNetwork")}
              onChange={(e) => {
                setVerifiedName("");
                setValue("accountName", "");
              }}
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
            <div className="flex gap-2">
              <Input
                {...register("accountNumber")}
                placeholder="0241234567"
                onChange={(e) => {
                   setVerifiedName("");
                   setValue("accountName", "");
                }}
                className="flex-1"
                error={errors.accountNumber?.message}
              />
              <Button 
                 type="button"
                 variant="secondary"
                 disabled={isVerifying || !!verifiedName}
                 onClick={verifyAccountName}
              >
                 {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify Name"}
              </Button>
            </div>
          </div>

          {verifiedName && (
             <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
               <p className="text-xs text-green-700 uppercase tracking-wide">Verified Name</p>
               <p className="text-sm font-medium text-green-900 mt-1">{verifiedName}</p>
             </div>
          )}

          {/* Amount */}
          {verifiedName && (
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
               {errors.amount &&
                 parseFloat(getValues("amount") || "0") > balance && (
                   <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                     <AlertTriangle className="w-3 h-3" />
                     Insufficient balance
                   </p>
                 )}
             </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowWithdrawModal(false);
                reset();
                setVerifiedName("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={withdrawMutation.isPending || !verifiedName}
            >
              {withdrawMutation.isPending ? "Processing..." : "Confirm & Withdraw"}
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
                <p className="text-sm mt-1">Mobile Money</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Network
                </p>
                <p className="text-sm mt-1">
                  {selectedWithdrawal.mobileNetwork}
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

            {selectedWithdrawal.adminNote && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-600 uppercase tracking-wide">
                  Note
                </p>
                <p className="text-sm text-red-800 mt-1">
                  {selectedWithdrawal.adminNote}
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
