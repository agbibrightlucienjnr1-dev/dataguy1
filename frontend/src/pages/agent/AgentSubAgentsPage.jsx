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
import { Card, Input, Badge } from "../../components/ui";
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Sub-Agents</h1>
          <p className="text-slate-600 mt-1">
            Manage and view your sub-agents' performance
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Sub-Agents</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {total}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Orders</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {subAgents.reduce((sum, sa) => sum + sa.totalOrders, 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
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
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
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
            <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>
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
        <Card className="p-8 text-center">
          <div className="flex items-center justify-center gap-2 text-slate-500">
            <RefreshCw className="w-5 h-5 animate-spin" />
            Loading sub-agents...
          </div>
        </Card>
      ) : filteredSubAgents.length === 0 ? (
        <Card className="p-8 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">
            {searchQuery
              ? "No sub-agents found matching your search"
              : "No sub-agents yet. Share your registration link to recruit sub-agents."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredSubAgents.map((subAgent) => (
            <Card key={subAgent.id} className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Sub-Agent Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {subAgent.name}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {subAgent.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {subAgent.phone}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(subAgent.registeredAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Statistics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:w-auto w-full">
                  <div className="text-center">
                    <p className="text-xs text-slate-500 mb-1">Orders</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {subAgent.totalOrders}
                    </p>
                    <div className="flex items-center justify-center gap-1 text-xs text-slate-400 mt-1">
                      <span>
                        {getStatusCount(subAgent, "completed")} completed
                      </span>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-xs text-slate-500 mb-1">Revenue</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {formatCurrency(subAgent.totalRevenue)}
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-xs text-slate-500 mb-1">Balance</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {formatCurrency(subAgent.walletBalance)}
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-xs text-slate-500 mb-1">My Commission</p>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(subAgent.totalParentCommission)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Status Breakdown */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex flex-wrap gap-2">
                  {subAgent.orderStats?.map((stat) => (
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
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
