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
import { Card, Badge, Button, Modal } from "../../components/ui";
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
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left p-4 text-sm font-medium text-slate-500">
                  User
                </th>
                <th className="text-left p-4 text-sm font-medium text-slate-500">
                  Contact
                </th>
                <th className="text-left p-4 text-sm font-medium text-slate-500">
                  Role
                </th>
                <th className="text-left p-4 text-sm font-medium text-slate-500">
                  Orders
                </th>
                <th className="text-left p-4 text-sm font-medium text-slate-500">
                  Wallet
                </th>
                <th className="text-left p-4 text-sm font-medium text-slate-500">
                  Joined
                </th>
                <th className="text-right p-4 text-sm font-medium text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-slate-50 hover:bg-slate-50"
                  >
                    <td className="p-4">
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
                    <td className="p-4">
                      <p className="text-sm text-slate-900">{user.phone}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </td>
                    <td className="p-4">{getRoleBadge(user.role)}</td>
                    <td className="p-4">
                      <span className="text-sm text-slate-900">
                        {user.totalOrders || 0}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-medium text-slate-900">
                        {formatCurrency(user.walletBalance || 0)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-slate-500">
                        {formatDate(user.createdAt)}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewUserDetails(user)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {selectedUser.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {selectedUser.name}
                </h3>
                {getRoleBadge(selectedUser.role)}
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-slate-600">
                <Phone className="w-4 h-4" />
                <span>{selectedUser.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Mail className="w-4 h-4" />
                <span>{selectedUser.email}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Calendar className="w-4 h-4" />
                <span>Joined {formatDate(selectedUser.createdAt)}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <ShoppingCart className="w-4 h-4" />
                  Total Orders
                </div>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {selectedUser.totalOrders || 0}
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Wallet className="w-4 h-4" />
                  Wallet Balance
                </div>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {formatCurrency(selectedUser.walletBalance || 0)}
                </p>
              </div>
            </div>

            {/* Payment Link */}
            <div className="p-4 bg-slate-900 rounded-lg text-white">
              <p className="text-sm text-slate-300 mb-1">Payment Link Code</p>
              <p className="font-mono text-sm">
                {selectedUser.paymentLinkCode}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
