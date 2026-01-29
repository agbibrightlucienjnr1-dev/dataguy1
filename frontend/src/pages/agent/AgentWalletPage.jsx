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
import { Card, Button, Badge } from "../../components/ui";
import { walletApi } from "../../api";
import { formatCurrency, formatDate } from "../../utils/formatters";

const TRANSACTION_TYPES = {
  commission: {
    label: "Commission",
    icon: ArrowDownLeft,
    color: "text-green-600",
  },
  withdrawal: {
    label: "Withdrawal",
    icon: ArrowUpRight,
    color: "text-red-600",
  },
  refund: { label: "Refund", icon: ArrowDownLeft, color: "text-blue-600" },
  adjustment: {
    label: "Adjustment",
    icon: TrendingUp,
    color: "text-slate-600",
  },
};

export default function AgentWalletPage() {
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
        <Card className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-300 text-sm">Available Balance</span>
            <Wallet className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-3xl font-bold">
            {walletLoading ? "..." : formatCurrency(wallet.balance)}
          </p>
          {wallet.pendingBalance > 0 && (
            <p className="text-sm text-slate-400 mt-2">
              + {formatCurrency(wallet.pendingBalance)} pending
            </p>
          )}
        </Card>

        {/* Total Earned */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-600 text-sm">Total Earned</span>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {formatCurrency(summary.totalEarned)}
          </p>
          <p className="text-sm text-green-600 mt-2">All time earnings</p>
        </Card>

        {/* This Month */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-600 text-sm">This Month</span>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {formatCurrency(summary.thisMonth)}
          </p>
          <p className="text-sm text-slate-500 mt-2">Earned this month</p>
        </Card>
      </div>

      {/* Transactions */}
      <Card>
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
              className="h-9 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
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
            <div className="p-8 text-center text-slate-500">
              Loading transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Wallet className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              No transactions yet
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
                  className="p-4 flex items-center justify-between hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isCredit ? "bg-green-100" : "bg-red-100"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          isCredit ? "text-green-600" : "text-red-600"
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
                      className={`font-semibold ${
                        isCredit ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {isCredit ? "+" : "-"}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-slate-500 justify-end">
                      {transaction.status === "completed" ? (
                        <CheckCircle className="w-3 h-3 text-green-500" />
                      ) : (
                        <Clock className="w-3 h-3 text-yellow-500" />
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
      </Card>

      {/* Info */}
      <Card className="p-4 bg-green-50 border-green-200">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Wallet className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h4 className="font-medium text-green-900">Earnings</h4>
            <p className="text-sm text-green-700 mt-1">
              Your commission is automatically credited to your wallet when a
              customer completes a purchase through your payment link. You can
              withdraw your earnings at any time.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
