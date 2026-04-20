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
  Legend 
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
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
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
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Analytics</h1>
          <p className="text-slate-500">Live traffic and conversion metrics perfectly tracked via internal DB engine.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Page Views (30d)"
          value={stats?.totalPageViews || 0}
          icon={<MousePointerClick className="w-6 h-6 text-emerald-600" />}
          bgColor="bg-emerald-50"
        />
        <MetricCard
          title="Unique Visitors (30d)"
          value={stats?.uniqueVisitors || 0}
          icon={<Users className="w-6 h-6 text-blue-600" />}
          bgColor="bg-blue-50"
        />
        <MetricCard
          title="Total USSD Dials (30d)"
          value={stats?.ussdDials || 0}
          icon={<Smartphone className="w-6 h-6 text-purple-600" />}
          bgColor="bg-purple-50"
        />
        <MetricCard
          title="Conversion Rate"
          value={`${stats?.conversionRate || "0.00"}%`}
          icon={<Activity className="w-6 h-6 text-orange-600" />}
          bgColor="bg-orange-50"
        />
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200">
        <div className="mb-6">
           <h3 className="text-lg font-semibold text-slate-900">Traffic Trends (Last 7 Days)</h3>
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
              <Line type="monotone" name="Web Views" dataKey="views" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
              <Line type="monotone" name="Unique Web Users" dataKey="unique" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" name="USSD Dials" dataKey="ussd" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, icon, bgColor }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
    <div className="flex items-center gap-4">
      <div className={`p-4 rounded-xl ${bgColor}`}>{icon}</div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
      </div>
    </div>
  </div>
);
