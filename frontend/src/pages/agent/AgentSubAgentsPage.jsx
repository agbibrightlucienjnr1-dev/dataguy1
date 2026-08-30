import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Search,
  Mail,
  Phone,
  Calendar,
  Wallet,
  ShoppingCart,
  TrendingUp,
  User,
  RefreshCw,
} from "lucide-react";
import { Card, Input, Badge, EmptyState, Reveal } from "../../components/ui";
import { agentApi } from "../../api";
import { formatCurrency, formatDate } from "../../utils/formatters";

export default function AgentSubAgentsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch sub-agents
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["mySubAgents"],
    queryFn: () => agentApi.getSubAgents(),
  });

  const subAgents = data?.data?.subAgents || [];
  const total = data?.data?.total || 0;

  // Filter by search
  const filteredSubAgents = searchQuery
    ? subAgents.filter(
        (subAgent) =>
          subAgent.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          subAgent.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          subAgent.phone?.includes(searchQuery),
      )
    : subAgents;

  const getStatusCount = (subAgent, status) => {
    const stat = subAgent.orderStats?.find((s) => s.status === status);
    return stat?.count || 0;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="animate-fade-in-up flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Sub-Agents</h1>
          <p className="text-slate-600 mt-1">
            Manage and view your sub-agents' performance
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="shimmer-sweep flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 shadow-sm shadow-brand-600/20"
        >
          <RefreshCw
            className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Reveal variant="scale" as={Card} className="p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Sub-Agents</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {total}
              </p>
            </div>
            <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-brand-600" />
            </div>
          </div>
        </Reveal>

        <Reveal variant="scale" delay={80} as={Card} className="p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Orders</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {subAgents.reduce((sum, sa) => sum + sa.totalOrders, 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-action-50 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-action-600" />
            </div>
          </div>
        </Reveal>

        <Reveal variant="scale" delay={160} as={Card} className="p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Revenue</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {formatCurrency(
                  subAgents.reduce(
                    (sum, sa) => sum + parseFloat(sa.totalRevenue || 0),
                    0,
                  ),
                )}
              </p>
            </div>
            <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-sky-600" />
            </div>
          </div>
        </Reveal>

        <Reveal variant="scale" delay={240} as={Card} className="p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">My Commission</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {formatCurrency(
                  subAgents.reduce(
                    (sum, sa) =>
                      sum + parseFloat(sa.totalParentCommission || 0),
                    0,
                  ),
                )}
              </p>
            </div>
            <div className="w-12 h-12 bg-action-50 rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-action-600" />
            </div>
          </div>
        </Reveal>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Sub-Agents List */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
           {[...Array(3)].map((_, i) => (
             <Card key={i} className="p-6">
               <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                 <div className="flex-1">
                   <div className="flex items-center gap-3 mb-3">
                     <div className="w-10 h-10 bg-slate-200 animate-pulse rounded-full"></div>
                     <div className="space-y-2">
                        <div className="w-32 h-5 bg-slate-200 animate-pulse rounded"></div>
                        <div className="flex gap-2">
                           <div className="w-20 h-3 bg-slate-200 animate-pulse rounded"></div>
                           <div className="w-24 h-3 bg-slate-200 animate-pulse rounded"></div>
                        </div>
                     </div>
                   </div>
                 </div>
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:w-auto w-full pt-4 lg:pt-0">
                    {[...Array(4)].map((_, j) => (
                       <div key={j} className="flex flex-col items-center gap-2">
                          <div className="w-16 h-3 bg-slate-200 animate-pulse rounded"></div>
                          <div className="w-20 h-6 bg-slate-200 animate-pulse rounded"></div>
                       </div>
                    ))}
                 </div>
               </div>
             </Card>
           ))}
        </div>
      ) : filteredSubAgents.length === 0 ? (
        <Card className="p-8">
           <EmptyState
             icon={Users}
             title={searchQuery ? "No matches found" : "No sub-agents yet"}
             description={
               searchQuery
                 ? "No sub-agents found matching your search term."
                 : "Share your registration link to recruit sub-agents."
             }
           />
        </Card>
      ) : (
        <Reveal>
          {/* Desktop table */}
          <Card className="hidden lg:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-brand-50/40 border-b border-slate-200">
                    <th className="pl-5 pr-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sub-Agent</th>
                    <th className="px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
                    <th className="px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Orders</th>
                    <th className="px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Revenue</th>
                    <th className="px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Balance</th>
                    <th className="px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Commission</th>
                    <th className="pl-3 pr-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubAgents.map((subAgent) => (
                    <tr key={subAgent.id} className="hover:bg-brand-50/40 transition-colors">
                      <td className="pl-5 pr-3 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 shrink-0 bg-linear-to-br from-brand-600 to-sky-600 rounded-full flex items-center justify-center shadow-sm shadow-brand-600/30">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 truncate max-w-[160px]">{subAgent.name}</div>
                            <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5 truncate max-w-[160px]">
                              <Mail className="w-3 h-3 shrink-0" />
                              <span className="truncate">{subAgent.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-slate-500 whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          {formatDate(subAgent.registeredAt)}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-right">
                        <div className="font-semibold text-slate-900">{subAgent.totalOrders}</div>
                        <div className="text-xs text-slate-400 whitespace-nowrap">{getStatusCount(subAgent, "completed")} done</div>
                      </td>
                      <td className="px-3 py-4 text-right font-semibold text-slate-900 whitespace-nowrap">
                        {formatCurrency(subAgent.totalRevenue)}
                      </td>
                      <td className="px-3 py-4 text-right font-semibold text-slate-900 whitespace-nowrap">
                        {formatCurrency(subAgent.walletBalance)}
                      </td>
                      <td className="px-3 py-4 text-right font-semibold text-action-600 whitespace-nowrap">
                        {formatCurrency(subAgent.totalParentCommission)}
                      </td>
                      <td className="pl-3 pr-5 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {subAgent.orderStats?.map((stat) => (
                            <Badge
                              key={stat.status}
                              size="sm"
                              variant={
                                stat.status === "completed"
                                  ? "success"
                                  : stat.status === "failed"
                                    ? "danger"
                                    : "secondary"
                              }
                            >
                              {stat.status}: {stat.count}
                            </Badge>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile card list */}
          <div className="lg:hidden grid grid-cols-1 gap-4">
            {filteredSubAgents.map((subAgent) => (
              <Card key={subAgent.id} className="p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 shrink-0 bg-linear-to-br from-brand-600 to-sky-600 rounded-full flex items-center justify-center shadow-sm shadow-brand-600/30">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{subAgent.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                      <Calendar className="w-3 h-3 shrink-0" />
                      Joined {formatDate(subAgent.registeredAt)}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 text-sm text-slate-600 mb-4">
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    {subAgent.email}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    {subAgent.phone}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Orders</p>
                    <p className="text-base font-semibold text-slate-900">{subAgent.totalOrders}</p>
                    <p className="text-xs text-slate-400">{getStatusCount(subAgent, "completed")} completed</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Revenue</p>
                    <p className="text-base font-semibold text-slate-900">{formatCurrency(subAgent.totalRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Balance</p>
                    <p className="text-base font-semibold text-slate-900">{formatCurrency(subAgent.walletBalance)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">My Commission</p>
                    <p className="text-base font-semibold text-action-600">{formatCurrency(subAgent.totalParentCommission)}</p>
                  </div>
                </div>

                {subAgent.orderStats?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                    {subAgent.orderStats.map((stat) => (
                      <Badge
                        key={stat.status}
                        variant={
                          stat.status === "completed"
                            ? "success"
                            : stat.status === "failed"
                              ? "danger"
                              : "secondary"
                        }
                      >
                        {stat.status}: {stat.count}
                      </Badge>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </Reveal>
      )}
    </div>
  );
}
