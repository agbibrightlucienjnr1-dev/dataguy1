import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Users,
  User,
  ChevronLeft,
  ChevronRight,
  Eye,
  Phone,
  Mail,
  Calendar,
  ShoppingCart,
  Wallet,
  Loader2,
  Plus,
  Minus,
  Settings2
} from "lucide-react";
import toast from "react-hot-toast";
import { Card, Badge, Button, Modal, EmptyState, SkeletonTable, Input, Reveal } from "../../components/ui";
import { adminApi } from "../../api";
import { formatCurrency, formatDate } from "../../utils/formatters";

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const queryClient = useQueryClient();

  const [showAdjustForm, setShowAdjustForm] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustAction, setAdjustAction] = useState("add");

  const adjustMutation = useMutation({
    mutationFn: (data) => adminApi.adjustWalletBalance(selectedUser.id, data),
    onSuccess: (res) => {
      toast.success(res.data?.message || "Wallet adjusted successfully");
      setShowAdjustForm(false);
      setAdjustAmount("");
      setAdjustReason("");

      if (res.data?.wallet) {
        setSelectedUser((prev) => ({ ...prev, walletBalance: res.data.wallet.balance }));
      }

      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to adjust wallet");
    }
  });

  const handleAdjustSubmit = (e) => {
    e.preventDefault();
    if (!adjustAmount || isNaN(adjustAmount) || parseFloat(adjustAmount) <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }
    if (!adjustReason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    adjustMutation.mutate({
      amount: parseFloat(adjustAmount),
      action: adjustAction,
      reason: adjustReason
    });
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "users", { search, role: roleFilter, page }],
    queryFn: () =>
      adminApi.getUsers({
        search: search || undefined,
        role: roleFilter || undefined,
        page,
        limit: 20,
      }),
  });

  // API client returns response.data directly: { success, users, pagination }
  const users = data?.users || [];
  const pagination = data?.pagination || {
    page: 1,
    totalPages: 1,
    total: 0,
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    refetch();
  };

  const viewUserDetails = async (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "agent":
        return <Badge variant="primary">Agent</Badge>;
      case "sub_agent":
        return <Badge variant="secondary">Sub-Agent</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="animate-fade-in-up flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Users</h1>
          <p className="text-slate-600 mt-1">
            Manage agents and sub-agents on the platform
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Users className="w-4 h-4" />
          {pagination.total} total users
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 rounded-2xl animate-fade-in-up animation-delay-150">
        <form
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="">All Roles</option>
            <option value="agent">Agents</option>
            <option value="sub_agent">Sub-Agents</option>
          </select>
          <Button type="submit">Search</Button>
        </form>
      </Card>

      {/* Users Table */}
      <Reveal>
      <Card className="overflow-hidden rounded-2xl">
        {isLoading ? (
          <div className="p-6">
            <SkeletonTable rows={5} columns={7} />
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            icon="users"
            title="No users found"
            description="There are currently no users matching your criteria."
          />
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-brand-50/60 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">User</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Contact</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Role</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Orders</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Wallet</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Joined</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-slate-50 hover:bg-brand-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-tr from-brand-600 to-brand-400 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {user.name?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {user.name}
                            </p>
                            <p className="text-xs text-slate-500 font-mono">
                              {user.paymentLinkCode?.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-900">{user.phone}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </td>
                      <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-900">
                          {user.totalOrders || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-slate-900">
                          {formatCurrency(user.walletBalance || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-500">
                          {formatDate(user.createdAt)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewUserDetails(user)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden divide-y divide-slate-100">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => viewUserDetails(user)}
                  className="w-full text-left p-4 hover:bg-brand-50/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 shrink-0 bg-gradient-to-tr from-brand-600 to-brand-400 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {user.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.phone}</p>
                      </div>
                    </div>
                    <div className="shrink-0">{getRoleBadge(user.role)}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-slate-50 rounded-lg p-2">
                      <p className="text-xs text-slate-500">Orders</p>
                      <p className="font-medium text-slate-900">{user.totalOrders || 0}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2">
                      <p className="text-xs text-slate-500">Wallet</p>
                      <p className="font-medium text-slate-900">{formatCurrency(user.walletBalance || 0)}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Joined {formatDate(user.createdAt)}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Page {pagination.page} of {pagination.totalPages}
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
                  setPage((p) => Math.min(pagination.totalPages, p + 1))
                }
                disabled={page === pagination.totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
      </Reveal>

      {/* User Details Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title="User Details"
      >
        {selectedUser && (
          <div className="space-y-6">
            {/* User Header */}
            <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
              <div className="w-16 h-16 bg-gradient-to-tr from-brand-600 to-brand-400 rounded-full flex items-center justify-center shadow-lg shadow-brand-200">
                <span className="text-2xl font-bold text-white">
                  {selectedUser.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-slate-900">
                    {selectedUser.name}
                  </h3>
                  {getRoleBadge(selectedUser.role)}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {formatDate(selectedUser.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Contact Information */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Contact Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg text-slate-700">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">{selectedUser.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg text-slate-700">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">{selectedUser.email}</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Activity & Earnings</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-brand-50 border border-brand-100 rounded-2xl">
                    <div className="flex items-center gap-2 text-brand-600 text-sm font-medium mb-1">
                      <ShoppingCart className="w-4 h-4" />
                      Total Orders
                    </div>
                    <p className="font-display text-3xl font-bold text-slate-900">
                      {selectedUser.totalOrders || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                        <Wallet className="w-4 h-4" />
                        Wallet Balance
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAdjustForm(!showAdjustForm)}
                        className="h-6 w-6 p-0 bg-emerald-100 hover:bg-emerald-200 text-emerald-700"
                        title="Adjust Wallet"
                      >
                        <Settings2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="font-display text-3xl font-bold text-slate-900">
                      {formatCurrency(selectedUser.walletBalance || 0)}
                    </p>
                  </div>
                </div>

                {/* Adjust Wallet Form */}
                {showAdjustForm && (
                  <div className="mt-4 p-4 border border-slate-200 rounded-xl bg-white shadow-sm animate-in fade-in slide-in-from-top-2">
                    <h5 className="text-sm font-semibold text-slate-900 mb-3">Adjust Wallet Balance</h5>
                    <form onSubmit={handleAdjustSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Action</label>
                          <select
                            value={adjustAction}
                            onChange={(e) => setAdjustAction(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                          >
                            <option value="add">Add Funds</option>
                            <option value="deduct">Deduct Funds</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Amount</label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="0.00"
                            value={adjustAmount}
                            onChange={(e) => setAdjustAmount(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Reason / Note</label>
                        <Input
                          type="text"
                          placeholder="e.g. Refund for failed order #123"
                          value={adjustReason}
                          onChange={(e) => setAdjustReason(e.target.value)}
                          required
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAdjustForm(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          variant={adjustAction === "add" ? "primary" : "danger"}
                          disabled={adjustMutation.isPending}
                        >
                          {adjustMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : adjustAction === "add" ? (
                            <Plus className="w-4 h-4 mr-2" />
                          ) : (
                            <Minus className="w-4 h-4 mr-2" />
                          )}
                          {adjustAction === "add" ? "Add Funds" : "Deduct Funds"}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
              </div>

              {/* Payment Link */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">System Identity</h4>
                <div className="p-4 bg-slate-900 rounded-xl text-white flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 mb-1 uppercase font-semibold">Payment Link Code</p>
                    <p className="font-mono text-lg font-medium text-brand-300">
                      {selectedUser.paymentLinkCode}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
