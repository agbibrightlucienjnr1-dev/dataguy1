import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  Download,
  CheckCircle,
  Package
} from "lucide-react";
import { Card, Button, Spinner } from "../../components/ui";
import { adminApi } from "../../api";
import { formatCurrency } from "../../utils/formatters";
import toast from "react-hot-toast";

const COLORS = [
  '#7c3aed', // Brand violet 600
  '#059669', // Action emerald 600
  '#d97706', // Amber 600
  '#dc2626', // Red 600
  '#0891b2', // Cyan 600
  '#c026d3', // Fuchsia 600
  '#4d7c0f', // Lime 700
  '#c2410c', // Orange 700
  '#0369a1', // Sky 700
  '#be123c', // Rose 700
  '#db2777', // Pink 600
  '#0d9488', // Teal 600
  '#9333ea', // Purple 600
  '#475569', // Slate 600
  '#ca8a04', // Yellow 600
  '#4338ca', // Indigo 700 (fallback tail)
  '#0f766e', // Teal 700
  '#a21caf', // Fuchsia 700
];

export default function AdminReportsPage() {
  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ["admin", "reports"],
    queryFn: () => adminApi.getReportsData(),
  });

  const reports = response?.data || {};

  const handleExportCSV = (dataStr, filename) => {
    try {
      if (!dataStr) return;
      const blob = new Blob([dataStr], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`${filename} exported successfully!`);
    } catch (err) {
      toast.error("Failed to export data");
    }
  };

  const exportSalesCSV = () => {
    if (!reports.salesTrend?.length) return toast.error("No data available");
    let csv = "Date,Revenue,Orders\n";
    reports.salesTrend.forEach(row => {
      csv += `${row.date},${row.revenue},${row.orders}\n`;
    });
    handleExportCSV(csv, "sales_trend_30days.csv");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Analytics Reports</h1>
          <p className="text-slate-600 mt-1">Platform performance over the last 30 days</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
          <TrendingUp className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-violet-50 text-brand-600 rounded-2xl">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">30D Revenue</p>
              <h3 className="font-display text-2xl font-bold text-slate-900">
                {formatCurrency(reports.overview?.totalRevenue || 0)}
              </h3>
            </div>
          </div>
        </Card>
        <Card className="p-6 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-violet-50 text-brand-600 rounded-2xl">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">30D Order Volume</p>
              <h3 className="font-display text-2xl font-bold text-slate-900">
                {reports.overview?.totalVolume?.toLocaleString() || 0}
              </h3>
            </div>
          </div>
        </Card>
        <Card className="p-6 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-action-600 rounded-2xl">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Order Success Rate</p>
              <h3 className="font-display text-2xl font-bold text-slate-900">
                {reports.overview?.successRate || 0}%
              </h3>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart */}
        <Card className="p-6 lg:col-span-2 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-display text-lg font-bold text-slate-900">Revenue Trend</h3>
             <Button variant="outline" size="sm" onClick={exportSalesCSV}>
               <Download className="w-4 h-4 mr-2" /> Export
             </Button>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reports.salesTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  tickFormatter={val => new Date(val).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={val => `₵${val}`}
                />
                <Tooltip
                  cursor={{stroke: '#cbd5e1'}}
                  contentStyle={{borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  formatter={(value, name) => [
                     name === 'revenue' ? `₵${value.toFixed(2)}` : value,
                     name.charAt(0).toUpperCase() + name.slice(1)
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#7c3aed"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{r: 6}}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Volume Distribution Pie */}
        <Card className="p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <div className="mb-2">
            <h3 className="font-display text-lg font-bold text-slate-900">MTN Volume Distribution</h3>
            <p className="text-sm text-slate-500">Distribution over last 30 days</p>
          </div>
          <div className="flex-1 min-h-[300px]">
             {reports.volumeDistribution?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reports.volumeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {reports.volumeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                       formatter={(value) => [value, "Orders"]}
                       contentStyle={{borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                  </PieChart>
                </ResponsiveContainer>
             ) : (
                <div className="flex h-full items-center justify-center text-slate-500 text-sm">
                   No data available to render chart
                </div>
             )}
          </div>
        </Card>
      </div>

    </div>
  );
}
