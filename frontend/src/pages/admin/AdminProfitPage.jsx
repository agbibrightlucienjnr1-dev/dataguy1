import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Wallet,
  TrendingUp,
  CreditCard,
  MinusCircle,
  Plus,
  Trash2,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown,
  Info,
  ChevronLeft,
  ChevronRight,
  Search
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { Card, Button, Spinner, Reveal } from "../../components/ui";
import { useCountUp } from "../../hooks";
import { adminApi } from "../../api";
import { formatCurrency } from "../../utils/formatters";
import toast from "react-hot-toast";

function StatValue({ value, isLoading, className }) {
  const numeric = Number(value) || 0;
  const animated = useCountUp(numeric, { start: !isLoading, duration: 1000 });
  return <span className={className}>{isLoading ? "..." : formatCurrency(animated)}</span>;
}

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" }
];

const PIE_COLORS = ["#1e3c66", "#fb7185", "#fbbf24", "#f472b6", "#5779a6", "#059669"];

export default function AdminProfitPage() {
  const queryClient = useQueryClient();
  const currentDate = new Date();
  
  // Date states
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  
  // Ledger search and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Expense form state
  const [expenseForm, setExpenseForm] = useState({
    category: "SMS Credits",
    amount: "",
    description: "",
    date: currentDate.toISOString().split("T")[0]
  });

  // Fetch profit analysis data
  const { data: analysisData, isLoading, refetch } = useQuery({
    queryKey: ["admin", "profit-analysis", selectedMonth, selectedYear],
    queryFn: async () => {
      const response = await adminApi.getProfitAnalysis({
        month: selectedMonth,
        year: selectedYear
      });
      return response.data;
    }
  });

  // Log expense mutation
  const logExpenseMutation = useMutation({
    mutationFn: (data) => adminApi.createExpense(data),
    onSuccess: () => {
      toast.success("Expense logged successfully");
      setExpenseForm({
        category: "SMS Credits",
        amount: "",
        description: "",
        date: currentDate.toISOString().split("T")[0]
      });
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to log expense");
    }
  });

  // Delete expense mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: (id) => adminApi.deleteExpense(id),
    onSuccess: () => {
      toast.success("Expense deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete expense");
    }
  });

  const handleLogExpense = (e) => {
    e.preventDefault();
    if (!expenseForm.amount || parseFloat(expenseForm.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    logExpenseMutation.mutate({
      ...expenseForm,
      amount: parseFloat(expenseForm.amount)
    });
  };

  const handleDeleteExpense = (id) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      deleteExpenseMutation.mutate(id);
    }
  };

  // Process data for presentation
  const overview = analysisData?.overview || {
    totalGrossCollected: "0.00",
    totalGatewayFees: "0.00",
    totalNetSettlement: "0.00",
    totalWholesaleCosts: "0.00",
    totalCommissions: "0.00",
    totalExpenses: "0.00",
    totalWithdrawalFees: "0.00",
    totalNetProfit: "0.00"
  };

  const overall = analysisData?.overall || {
    totalGrossCollected: "0.00",
    totalGatewayFees: "0.00",
    totalNetSettlement: "0.00",
    totalWholesaleCosts: "0.00",
    totalCommissions: "0.00",
    totalExpenses: "0.00",
    totalWithdrawalFees: "0.00",
    totalNetProfit: "0.00"
  };

  const ledger = analysisData?.ledger || [];
  const expensesList = analysisData?.expenses || [];
  const networkBreakdown = analysisData?.networkBreakdown || [];

  // Filtered ledger search
  const filteredLedger = ledger.filter(item => 
    item.customerPhone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.network?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginated ledger
  const totalPages = Math.ceil(filteredLedger.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLedger = filteredLedger.slice(startIndex, startIndex + itemsPerPage);

  // Recharts: Donut chart data for cost breakdown
  const pieData = [
    { name: "Supplier Wholesale Cost", value: parseFloat(overview.totalWholesaleCosts || 0) },
    { name: "Gateway Fees", value: parseFloat(overview.totalGatewayFees || 0) },
    { name: "Agent Commissions", value: parseFloat(overview.totalCommissions || 0) },
    { name: "Platform Expenses", value: parseFloat(overview.totalExpenses || 0) },
    { name: "Withdrawal Fees", value: parseFloat(overview.totalWithdrawalFees || 0) }
  ];
  
  const netProfitVal = parseFloat(overview.totalNetProfit);
  if (netProfitVal > 0) {
    pieData.push({ name: "Net Platform Profit", value: netProfitVal });
  }

  // Bar chart data for Operator Performance
  const barData = networkBreakdown.map(item => ({
    network: item.network,
    Revenue: parseFloat(item.grossCollected),
    Profit: parseFloat(item.netProfit)
  }));

  const isProfitPositive = parseFloat(overview.totalNetProfit) >= 0;

  return (
    <div className="space-y-6">
      {/* Header & Month/Year picker */}
      <div className="animate-fade-in-up flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-brand-600 animate-pulse" />
            System Profit Analysis
          </h1>
          <p className="text-slate-600 mt-1">
            Track gross collections, gateway fees, supplier costs, expenses, withdrawal fees, and net profit margins
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
          <Calendar className="w-4 h-4 text-slate-400 ml-1" />
          <select
            className="bg-transparent border-0 text-sm font-semibold text-slate-700 focus:ring-0 cursor-pointer"
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(parseInt(e.target.value));
              setCurrentPage(1);
            }}
          >
            {MONTHS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select
            className="bg-transparent border-0 text-sm font-semibold text-slate-700 focus:ring-0 cursor-pointer"
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(parseInt(e.target.value));
              setCurrentPage(1);
            }}
          >
            {[2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col justify-center items-center py-24 gap-3">
          <Spinner className="w-10 h-10 text-brand-600" />
          <span className="text-sm font-medium text-slate-500">Calculating system profit metrics...</span>
        </div>
      ) : (
        <>
          {/* Metrics Dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Gross Collected */}
            <Reveal variant="scale" delay={0}>
            <Card className="p-6 relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 border border-slate-100">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-50/60 rounded-bl-full flex items-start justify-end p-4">
                <Layers className="w-5 h-5 text-brand-500" />
              </div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Collections</div>
              <div className="text-3xl font-display font-extrabold text-slate-900 mt-2">
                <StatValue value={overview.totalGrossCollected} />
              </div>
              <p className="text-xs text-slate-500 mt-3 flex items-center gap-1 font-medium">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                Bundle prices paid + service fees
              </p>
            </Card>
            </Reveal>

            {/* Gateway Deductions */}
            <Reveal variant="scale" delay={60}>
            <Card className="p-6 relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 border border-slate-100">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50/50 rounded-bl-full flex items-start justify-end p-4">
                <CreditCard className="w-5 h-5 text-rose-500" />
              </div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gateway Deductions</div>
              <div className="text-3xl font-display font-extrabold text-slate-900 mt-2">
                <StatValue value={overview.totalGatewayFees} />
              </div>
              <p className="text-xs text-rose-600 mt-3 flex items-center gap-1 font-medium">
                <TrendingDown className="w-3.5 h-3.5" />
                Paystack/Moolre transaction cuts
              </p>
            </Card>
            </Reveal>

            {/* Net Settlement */}
            <Reveal variant="scale" delay={120}>
            <Card className="p-6 relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 border border-slate-100">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/50 rounded-bl-full flex items-start justify-end p-4">
                <Wallet className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Settlement</div>
              <div className="text-3xl font-display font-extrabold text-slate-900 mt-2">
                <StatValue value={overview.totalNetSettlement} />
              </div>
              <p className="text-xs text-emerald-600 mt-3 flex items-center gap-1 font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                Actual funds settled to merchant account
              </p>
            </Card>
            </Reveal>

            {/* Supplier Cost */}
            <Reveal variant="scale" delay={180}>
            <Card className="p-6 relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 border border-slate-100">
              <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50/70 rounded-bl-full flex items-start justify-end p-4">
                <Layers className="w-5 h-5 text-slate-500" />
              </div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Wholesale Costs (Supplier)</div>
              <div className="text-3xl font-display font-extrabold text-slate-900 mt-2">
                <StatValue value={overview.totalWholesaleCosts} />
              </div>
              <p className="text-xs text-slate-500 mt-3 flex items-center gap-1 font-medium">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                Wholesale prices + deposit markups
              </p>
            </Card>
            </Reveal>

            {/* Operating Expenses */}
            <Reveal variant="scale" delay={240}>
            <Card className="p-6 relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 border border-slate-100">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50/50 rounded-bl-full flex items-start justify-end p-4">
                <MinusCircle className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Platform Expenses</div>
              <div className="text-3xl font-display font-extrabold text-slate-900 mt-2">
                <StatValue value={overview.totalExpenses} />
              </div>
              <p className="text-xs text-amber-600 mt-3 flex items-center gap-1 font-medium">
                <Info className="w-3.5 h-3.5 text-amber-500" />
                Discrete costs logged this month
              </p>
            </Card>
            </Reveal>

            {/* Withdrawal Fees */}
            <Reveal variant="scale" delay={300}>
            <Card className="p-6 relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 border border-slate-100">
              <div className="absolute top-0 right-0 w-24 h-24 bg-pink-50/50 rounded-bl-full flex items-start justify-end p-4">
                <TrendingDown className="w-5 h-5 text-pink-500" />
              </div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Withdrawal Fees</div>
              <div className="text-3xl font-display font-extrabold text-slate-900 mt-2">
                <StatValue value={overview.totalWithdrawalFees} />
              </div>
              <p className="text-xs text-pink-600 mt-3 flex items-center gap-1 font-medium">
                <TrendingDown className="w-3.5 h-3.5" />
                Moolre withdrawal payout charges
              </p>
            </Card>
            </Reveal>

            {/* Net Platform Profit (This Month) */}
            <Reveal variant="scale" delay={360} className="sm:col-span-1 lg:col-span-1">
            <Card className={`p-6 relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 border border-transparent text-white ${
              isProfitPositive
                ? "bg-gradient-to-br from-action-600 to-action-800 shadow-action-200/50"
                : "bg-gradient-to-br from-red-600 to-red-800 shadow-red-200/50"
            }`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-bl-full flex items-start justify-end p-4">
                {isProfitPositive ? (
                  <ArrowUpRight className="w-6 h-6 text-white" />
                ) : (
                  <ArrowDownRight className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="text-xs font-bold opacity-80 uppercase tracking-wider">Net Platform Profit (This Month)</div>
              <div className="text-3xl font-display font-black mt-2">
                <StatValue value={overview.totalNetProfit} />
              </div>
              <p className="text-[10px] opacity-75 mt-1 font-mono">
                Formula: Net Settlement - Wholesale Costs - Commissions - Platform Expenses - Withdrawal Fees
              </p>
              <p className="text-xs opacity-90 mt-3 flex items-center gap-1 font-medium">
                {isProfitPositive ? (
                  <span>🚀 Positive monthly margin</span>
                ) : (
                  <span>⚠️ Monthly loss detected</span>
                )}
              </p>
            </Card>
            </Reveal>

            {/* Overall Net Profit (All Months) */}
            <Reveal variant="scale" delay={420} className="sm:col-span-1 lg:col-span-2">
            <Card className={`p-6 relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 border border-transparent text-white ${
              parseFloat(overall.totalNetProfit) >= 0
                ? "bg-gradient-to-br from-emerald-600 to-teal-800 shadow-emerald-200/50"
                : "bg-gradient-to-br from-rose-600 to-rose-900 shadow-rose-200/50"
            }`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-bl-full flex items-start justify-end p-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="text-xs font-bold opacity-80 uppercase tracking-wider">Overall Net Profit (All Months)</div>
              <div className="text-3xl font-display font-black mt-2">
                <StatValue value={overall.totalNetProfit} />
              </div>
              <p className="text-[10px] opacity-75 mt-1 font-mono">
                Lifetime Platform Profit across all registered months
              </p>
              <p className="text-xs opacity-90 mt-3 flex items-center gap-1 font-medium">
                {parseFloat(overall.totalNetProfit) >= 0 ? (
                  <span>🚀 Positive lifetime growth</span>
                ) : (
                  <span>⚠️ Negative lifetime balance</span>
                )}
              </p>
            </Card>
            </Reveal>
          </div>

          {/* Visual Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Cost Breakdown Donut Chart */}
            <Reveal>
            <Card className="p-6">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-600"></span>
                Cost & Profit Allocations
              </h3>
              
              <div className="h-64">
                {parseFloat(overview.totalGrossCollected) === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-sm font-medium text-slate-400">
                    No transactions registered for this month
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip formatter={(value) => formatCurrency(value)} />
                      <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center" 
                        iconType="circle"
                        wrapperStyle={{ fontSize: "12px", paddingTop: "15px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
            </Reveal>

            {/* Network Performance Bar Chart */}
            <Reveal delay={120}>
            <Card className="p-6">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-600"></span>
                Operator Revenue vs Profit
              </h3>
              
              <div className="h-64">
                {networkBreakdown.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-sm font-medium text-slate-400">
                    No operator metrics to show
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="network" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                      <ChartTooltip formatter={(value) => formatCurrency(value)} />
                      <Legend wrapperStyle={{ fontSize: "12px" }} />
                      <Bar dataKey="Revenue" fill="#1e3c66" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
            </Reveal>
          </div>

          {/* Network Performance Breakdown Table */}
          <Reveal>
          <Card className="p-6 overflow-hidden">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-600"></span>
              Operator Margin Ledger
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-brand-50/40 text-xs font-bold text-slate-500 uppercase">
                    <th className="pb-3 font-semibold">Operator</th>
                    <th className="pb-3 font-semibold text-right">Orders</th>
                    <th className="pb-3 font-semibold text-right">Gross Collected</th>
                    <th className="pb-3 font-semibold text-right">Gateway Deductions</th>
                    <th className="pb-3 font-semibold text-right">Commissions</th>
                    <th className="pb-3 font-semibold text-right">Wholesale Cost</th>
                    <th className="pb-3 font-semibold text-right">Net Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {networkBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-6 text-slate-400">
                        No operator records found.
                      </td>
                    </tr>
                  ) : (
                    networkBreakdown.map((item, idx) => (
                      <tr key={idx} className="hover:bg-brand-50/50 transition-colors">
                        <td className="py-3.5 font-bold text-slate-900">{item.network}</td>
                        <td className="py-3.5 text-right font-medium text-slate-700">{item.orders}</td>
                        <td className="py-3.5 text-right font-medium text-slate-900">{formatCurrency(item.grossCollected)}</td>
                        <td className="py-3.5 text-right font-medium text-rose-600">-{formatCurrency(item.gatewayFee)}</td>
                        <td className="py-3.5 text-right font-medium text-amber-600">-{formatCurrency(item.commission)}</td>
                        <td className="py-3.5 text-right font-medium text-slate-800">-{formatCurrency(item.actualHubnetCost)}</td>
                        <td className={`py-3.5 text-right font-bold ${
                          parseFloat(item.netProfit) >= 0 ? "text-action-600" : "text-red-600"
                        }`}>
                          {formatCurrency(item.netProfit)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
          </Reveal>

          {/* Operating Cost Expenses Log Tracker */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Form to Log Expense */}
            <Reveal>
            <Card className="p-6 h-fit">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <MinusCircle className="w-5 h-5 text-amber-500" />
                Log Platform Expense
              </h3>
              
              <form onSubmit={handleLogExpense} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Category</label>
                  <select
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-white"
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  >
                    <option value="SMS Credits">SMS Credits Top-up</option>
                    <option value="Hosting">Monthly Hosting</option>
                    <option value="Supplier Deposit Fee">Supplier Deposit Fee</option>
                    <option value="Support Operational">Support / Staff</option>
                    <option value="Domain">Domain Registration</option>
                    <option value="Other">Other Expenses</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Amount (GHS)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    placeholder="0.00"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Description</label>
                  <textarea
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    rows="2"
                    placeholder="e.g. 5000 SMS top-up credit..."
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Expense Date</label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="shimmer-sweep w-full flex items-center justify-center gap-1.5"
                  disabled={logExpenseMutation.isPending}
                >
                  {logExpenseMutation.isPending ? (
                    <Spinner className="w-4 h-4 mr-2" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add Expense
                    </>
                  )}
                </Button>
              </form>
            </Card>
            </Reveal>

            {/* Expenses List Ledger */}
            <Reveal delay={120}>
            <Card className="p-6 lg:col-span-2 overflow-hidden flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-600"></span>
                  Operational Expenses Log
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-brand-50/40 text-xs font-bold text-slate-500 uppercase">
                        <th className="pb-2 font-semibold">Date</th>
                        <th className="pb-2 font-semibold">Category</th>
                        <th className="pb-2 font-semibold">Description</th>
                        <th className="pb-2 font-semibold text-right">Amount</th>
                        <th className="pb-2 font-semibold text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {expensesList.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-10 text-slate-400">
                            No operating expenses registered for this month.
                          </td>
                        </tr>
                      ) : (
                        expensesList.map((exp) => (
                          <tr key={exp.id} className="hover:bg-brand-50/50 transition-colors">
                            <td className="py-2.5 text-xs text-slate-500">
                              {new Date(exp.date).toLocaleDateString()}
                            </td>
                            <td className="py-2.5 font-bold text-slate-900">{exp.category}</td>
                            <td className="py-2.5 text-xs text-slate-600 max-w-xs truncate" title={exp.description}>
                              {exp.description || "-"}
                            </td>
                            <td className="py-2.5 text-right font-medium text-rose-600">
                              {formatCurrency(exp.amount)}
                            </td>
                            <td className="py-2.5 text-center">
                              <button
                                onClick={() => handleDeleteExpense(exp.id)}
                                className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                disabled={deleteExpenseMutation.isPending}
                                title="Remove expense"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {expensesList.length > 0 && (
                <div className="border-t border-slate-100 pt-4 mt-4 flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-700">Total Monthly Expenses</span>
                  <span className="font-black text-rose-600">{formatCurrency(overview.totalExpenses)}</span>
                </div>
              )}
            </Card>
            </Reveal>
          </div>

          {/* Transaction Ledger */}
          <Reveal>
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-600"></span>
                  Transaction-by-Transaction Profit Ledger
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Individual order breakdowns including gross paid, gateway fee, wholesale cost, and net margins
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search phone, operator..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-slate-50"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-brand-50/40 text-xs font-bold text-slate-500 uppercase">
                    <th className="pb-3 font-semibold">Date/Time</th>
                    <th className="pb-3 font-semibold">Recipient</th>
                    <th className="pb-3 font-semibold">Operator</th>
                    <th className="pb-3 font-semibold">Volume</th>
                    <th className="pb-3 font-semibold text-center">Gateway</th>
                    <th className="pb-3 font-semibold text-right">Gross Collections</th>
                    <th className="pb-3 font-semibold text-right">Gateway Cuts</th>
                    <th className="pb-3 font-semibold text-right">Commissions</th>
                    <th className="pb-3 font-semibold text-right">Supplier Cost</th>
                    <th className="pb-3 font-semibold text-right">Net Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedLedger.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="text-center py-12 text-slate-400">
                        No matching transactions found.
                      </td>
                    </tr>
                  ) : (
                    paginatedLedger.map((item) => (
                      <tr key={item.id} className="hover:bg-brand-50/50 transition-colors text-xs">
                        <td className="py-3 text-slate-500 whitespace-nowrap">
                          {new Date(item.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 font-bold text-slate-900">{item.customerPhone}</td>
                        <td className="py-3 font-bold text-slate-700">{item.network}</td>
                        <td className="py-3 font-semibold text-slate-600">{item.volume}</td>
                        <td className="py-3 text-center">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-800 uppercase">
                            {item.paymentProvider}
                          </span>
                        </td>
                        <td className="py-3 text-right font-medium text-slate-900">{formatCurrency(item.grossCollected)}</td>
                        <td className="py-3 text-right font-medium text-rose-600">-{formatCurrency(item.gatewayFee)}</td>
                        <td className="py-3 text-right font-medium text-amber-600">-{formatCurrency(item.commission)}</td>
                        <td className="py-3 text-right font-medium text-slate-800">-{formatCurrency(item.actualHubnetCost)}</td>
                        <td className={`py-3 text-right font-bold ${
                          parseFloat(item.netProfit) >= 0 ? "text-action-600" : "text-red-600"
                        }`}>
                          {formatCurrency(item.netProfit)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-4">
                <span className="text-xs text-slate-500">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredLedger.length)} of {filteredLedger.length} items
                </span>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <Button
                      key={i}
                      variant={currentPage === i + 1 ? "primary" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
          </Reveal>
        </>
      )}
    </div>
  );
}
