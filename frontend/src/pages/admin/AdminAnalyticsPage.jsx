import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  MousePointerClick,
  Smartphone,
  Activity,
  ArrowLeft
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { adminApi } from "../../api/admin";

export const AdminAnalyticsPage = () => {
  const [data, setData] = useState({ stats: null, chartData: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const response = await adminApi.getAnalyticsDashboard();
        setData(response.data);
      } catch (err) {
        setError(err.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 flex flex-col items-center">
        <Activity className="w-10 h-10 mb-4 opacity-50" />
        <p className="font-medium text-lg">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { stats, chartData } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/admin"
          className="p-2 hover:bg-brand-50 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Platform Analytics</h1>
          <p className="text-slate-500">Live traffic and conversion metrics perfectly tracked via internal DB engine.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Page Views (30d)"
          value={stats?.totalPageViews || 0}
          icon={<MousePointerClick className="w-6 h-6 text-action-600" />}
          bgColor="bg-emerald-50"
        />
        <MetricCard
          title="Unique Visitors (30d)"
          value={stats?.uniqueVisitors || 0}
          icon={<Users className="w-6 h-6 text-brand-600" />}
          bgColor="bg-brand-50"
        />
        <MetricCard
          title="Total USSD Dials (30d)"
          value={stats?.ussdDials || 0}
          icon={<Smartphone className="w-6 h-6 text-sky-600" />}
          bgColor="bg-sky-50"
        />
        <MetricCard
          title="Conversion Rate"
          value={`${stats?.conversionRate || "0.00"}%`}
          icon={<Activity className="w-6 h-6 text-amber-600" />}
          bgColor="bg-amber-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 col-span-1 lg:col-span-2">
          <div className="mb-6">
             <h3 className="font-display text-lg font-semibold text-slate-900">Traffic Trends (Last 7 Days)</h3>
             <p className="text-sm text-slate-500">Compare web visits against offline USSD dial usage.</p>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="top" height={36}/>
                <Line type="monotone" name="Web Views" dataKey="views" stroke="#7C3AED" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                <Line type="monotone" name="Unique Web Users" dataKey="unique" stroke="#059669" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" name="USSD Dials" dataKey="ussd" stroke="#D97706" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col">
          <div className="mb-4">
            <h3 className="font-display text-lg font-semibold text-slate-900">Device Analytics</h3>
            <p className="text-sm text-slate-500">Traffic breakdown by hardware.</p>
          </div>
          <div className="flex-1 min-h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.deviceBreakdown || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {(stats?.deviceBreakdown || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={["#7C3AED", "#059669", "#D97706", "#DC2626"][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} Uses`, 'Impressions']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Agents */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <div className="mb-4">
             <h3 className="font-display text-lg font-semibold text-slate-900">Top Performing Agents</h3>
             <p className="text-sm text-slate-500">Highest traffic drivers across 30 days.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-sm bg-brand-50/40">
                  <th className="pb-3 pt-2 px-2 font-medium">Agent</th>
                  <th className="pb-3 pt-2 px-2 font-medium">Code</th>
                  <th className="pb-3 pt-2 px-2 font-medium text-right">Traffic Generated</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.topAgents || []).map((agent, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-brand-50/50 transition-colors">
                    <td className="py-4 px-2 text-sm font-medium text-slate-900">{agent.name}</td>
                    <td className="py-4 px-2 text-sm font-mono text-slate-500">{agent.code}</td>
                    <td className="py-4 px-2 text-sm text-right font-bold text-brand-600">{agent.views.toLocaleString()}</td>
                  </tr>
                ))}
                {(!stats?.topAgents || stats.topAgents.length === 0) && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-500">No agent data recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Paths */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <div className="mb-4">
             <h3 className="font-display text-lg font-semibold text-slate-900">Popular Paths</h3>
             <p className="text-sm text-slate-500">Most visited URLs & Entry Points.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-sm bg-brand-50/40">
                  <th className="pb-3 pt-2 px-2 font-medium">URL Source</th>
                  <th className="pb-3 pt-2 px-2 font-medium text-right">Footprints</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.topPaths || []).map((path, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-brand-50/50 transition-colors">
                    <td className="py-4 px-2 text-sm font-medium font-mono text-slate-700 truncate max-w-xs">{path.path}</td>
                    <td className="py-4 px-2 text-sm text-right font-bold text-action-600">{path.views.toLocaleString()}</td>
                  </tr>
                ))}
                {(!stats?.topPaths || stats.topPaths.length === 0) && (
                  <tr>
                    <td colSpan={2} className="py-8 text-center text-slate-500">No path data recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, icon, bgColor }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/50 hover:shadow-md transition-shadow">
    <div className="flex items-center gap-4">
      <div className={`p-4 rounded-2xl ${bgColor}`}>{icon}</div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="font-display text-2xl font-bold text-slate-900">{value}</h3>
      </div>
    </div>
  </div>
);
