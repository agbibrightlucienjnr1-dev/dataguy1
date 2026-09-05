import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  Clock,
  CheckCircle,
} from "lucide-react";
import { Card, Button, Badge, EmptyState, Reveal } from "../../components/ui";
import { useNavigate } from "react-router-dom";
import { walletApi } from "../../api";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { useCountUp } from "../../hooks";

const TRANSACTION_TYPES = {
  commission: {
    label: "Commission",
    icon: ArrowDownLeft,
    color: "text-action-600",
  },
  withdrawal: {
    label: "Withdrawal",
    icon: ArrowUpRight,
    color: "text-red-600",
  },
  refund: { label: "Refund", icon: ArrowDownLeft, color: "text-brand-600" },
  adjustment: {
    label: "Adjustment",
    icon: TrendingUp,
    color: "text-slate-600",
  },
};

export default function AgentWalletPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const limit = 10;

  // Fetch wallet balance
  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ["wallet"],
    queryFn: walletApi.getBalance,
  });

  // Fetch transactions
  const {
    data: transactionsData,
    isLoading: transactionsLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["walletTransactions", page, typeFilter],
    queryFn: () =>
      walletApi.getTransactions({
        page,
        limit,
        type: typeFilter || undefined,
      }),
  });

  // Fetch wallet summary
  const { data: summaryData } = useQuery({
    queryKey: ["walletSummary"],
    queryFn: walletApi.getSummary,
  });

  const wallet = walletData?.data?.wallet || { balance: 0, pendingBalance: 0 };
  const transactions = transactionsData?.data?.transactions || [];
  const paginationData = transactionsData?.data?.pagination || {};
  const pagination = {
    total: paginationData.total || 0,
    pages: paginationData.totalPages || paginationData.pages || 1,
  };
  const summary = summaryData?.data?.summary || {
    totalEarned: 0,
    totalWithdrawn: 0,
    thisMonth: 0,
  };

  const isLoading = walletLoading || transactionsLoading;

  const animatedBalance = useCountUp(wallet.balance, { start: !walletLoading, duration: 1200 });
  const animatedTotalEarned = useCountUp(summary.totalEarned, { start: true, duration: 1200 });
  const animatedThisMonth = useCountUp(summary.thisMonth, { start: true, duration: 1200 });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="animate-fade-in-up flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Wallet</h1>
          <p className="text-slate-600 mt-1">
            Manage your earnings and transactions
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

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Available Balance */}
        <Reveal variant="scale" as={Card} className="p-6 bg-linear-to-br from-brand-600 via-brand-700 to-sky-600 text-white shadow-lg shadow-brand-600/20 relative overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
          <Wallet className="absolute right-3 bottom-3 w-24 h-24 text-white/10" />
          <div className="flex items-center justify-between mb-4 relative">
            <span className="text-brand-100 text-sm">Available Balance</span>
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
              <Wallet className="w-4 h-4 text-white" />
            </div>
          </div>
          <p className="font-display text-4xl font-bold relative tabular-nums">
            {walletLoading ? "..." : formatCurrency(animatedBalance)}
          </p>
          {wallet.pendingBalance > 0 && (
            <p className="text-sm text-brand-100 mt-2 relative">
              + {formatCurrency(wallet.pendingBalance)} pending
            </p>
          )}
        </Reveal>

        {/* Total Earned */}
        <Reveal variant="scale" delay={80} as={Card} className="p-6 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-600 text-sm">Total Earned</span>
            <div className="w-9 h-9 rounded-xl bg-action-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-action-600" />
            </div>
          </div>
          <p className="font-display text-3xl font-bold text-slate-900 tabular-nums">
            {formatCurrency(animatedTotalEarned)}
          </p>
          <p className="text-sm text-action-600 mt-2">All time earnings</p>
        </Reveal>

        {/* This Month */}
        <Reveal variant="scale" delay={160} as={Card} className="p-6 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-600 text-sm">This Month</span>
            <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-brand-600" />
            </div>
          </div>
          <p className="font-display text-3xl font-bold text-slate-900 tabular-nums">
            {formatCurrency(animatedThisMonth)}
          </p>
          <p className="text-sm text-slate-500 mt-2">Earned this month</p>
        </Reveal>
      </div>

      {/* Transactions */}
      <Reveal as={Card}>
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Transaction History
          </h2>
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="">All Types</option>
              {Object.entries(TRANSACTION_TYPES).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {isLoading ? (
             <div className="space-y-0 divide-y divide-slate-100">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="p-4 flex flex-row items-center justify-between w-full h-[72px]">
                    <div className="flex gap-4 items-center">
                       <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse"></div>
                       <div className="flex flex-col gap-2">
                          <div className="w-24 h-4 bg-slate-200 animate-pulse rounded"></div>
                          <div className="w-32 h-3 bg-slate-200 animate-pulse rounded"></div>
                       </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       <div className="w-16 h-5 bg-slate-200 animate-pulse rounded"></div>
                       <div className="w-12 h-3 bg-slate-200 animate-pulse rounded"></div>
                    </div>
                  </div>
                ))}
             </div>
          ) : transactions.length === 0 ? (
            <div className="p-8">
              <EmptyState
                 icon={Wallet}
                 title="No transactions yet"
                 description="You haven't made any earnings or withdrawals yet."
                 action={{
                   label: "View Bundles",
                   onClick: () => navigate("/bundles"),
                 }}
              />
            </div>
          ) : (
            transactions.map((transaction) => {
              const typeInfo =
                TRANSACTION_TYPES[transaction.type] ||
                TRANSACTION_TYPES.adjustment;
              const Icon = typeInfo.icon;
              const isCredit =
                transaction.type === "commission" ||
                transaction.type === "refund";

              return (
                <div
                  key={transaction.id}
                  className="p-4 flex items-center justify-between hover:bg-brand-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isCredit ? "bg-action-100" : "bg-red-100"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          isCredit ? "text-action-600" : "text-red-600"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {typeInfo.label}
                      </p>
                      <p className="text-sm text-slate-500">
                        {transaction.description ||
                          formatDate(transaction.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-display font-semibold ${
                        isCredit ? "text-action-600" : "text-red-600"
                      }`}
                    >
                      {isCredit ? "+" : "-"}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-slate-500 justify-end">
                      {transaction.status === "completed" ? (
                        <CheckCircle className="w-3 h-3 text-action-500" />
                      ) : (
                        <Clock className="w-3 h-3 text-amber-500" />
                      )}
                      <span>{transaction.status}</span>
                    </div>
                  </div>
                </div>
              );
            })
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
      </Reveal>

      {/* Info */}
      <Reveal as={Card} delay={100} className="p-4 bg-action-50 border-action-200">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-action-100 rounded-xl flex items-center justify-center shrink-0">
            <Wallet className="w-4 h-4 text-action-600" />
          </div>
          <div>
            <h4 className="font-medium text-action-900">Earnings</h4>
            <p className="text-sm text-action-700 mt-1">
              Your commission is automatically credited to your wallet when a
              customer completes a purchase through your payment link. You can
              withdraw your earnings at any time.
            </p>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
