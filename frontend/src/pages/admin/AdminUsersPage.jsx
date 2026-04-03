import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
} from "lucide-react";
import { Card, Badge, Button, Modal, EmptyState, SkeletonTable } from "../../components/ui";
import { adminApi } from "../../api";
import { formatCurrency, formatDate } from "../../utils/formatters";

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
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
      <Card className="p-4">
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
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
          >
            <option value="">All Roles</option>
            <option value="agent">Agents</option>
            <option value="sub_agent">Sub-Agents</option>
          </select>
          <Button type="submit">Search</Button>
        </form>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden">
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
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
                    className="border-b border-slate-50 hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center">
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
              <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-indigo-400 rounded-full flex items-center justify-center shadow-lg shadow-indigo-200">
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
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                    <div className="flex items-center gap-2 text-blue-600 text-sm font-medium mb-1">
                      <ShoppingCart className="w-4 h-4" />
                      Total Orders
                    </div>
                    <p className="text-3xl font-bold text-slate-900">
                      {selectedUser.totalOrders || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium mb-1">
                      <Wallet className="w-4 h-4" />
                      Wallet Balance
                    </div>
                    <p className="text-3xl font-bold text-slate-900">
                      {formatCurrency(selectedUser.walletBalance || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Link */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">System Identity</h4>
                <div className="p-4 bg-slate-900 rounded-xl text-white flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 mb-1 uppercase font-semibold">Payment Link Code</p>
                    <p className="font-mono text-lg font-medium text-indigo-400">
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
