import React, { useState, useEffect } from "react";
import { adminApi } from "../../api";
import {
  Card,
  Button,
  Input,
  Modal,
  SkeletonTable,
  EmptyState,
} from "../../components/ui";
import { formatDate, formatCurrency } from "../../utils/formatters";
import {
  Video,
  Search,
  Download,
  Users,
  CheckCircle2,
  Clock,
  DollarSign,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Tag,
} from "lucide-react";
import toast from "react-hot-toast";

function downloadCsv(rows, filename) {
  const processRow = (row) =>
    row
      .map((val) => {
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(",");

  const csvContent =
    "data:text/csv;charset=utf-8," + rows.map(processRow).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function AdminEventsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [eventSettings, setEventSettings] = useState({
    title: "",
    price: 20,
    whatsappGroupLink: "",
    isActive: true,
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getEventRegistrations("ai-video-masterclass", {
        page,
        limit: 50,
        search: searchTerm,
        status: statusFilter || undefined,
      });
      setData(res.data);
      if (res.data?.event) {
        setEventSettings({
          title: res.data.event.title || "",
          price: res.data.event.price || 20,
          whatsappGroupLink: res.data.event.whatsappGroupLink || "",
          isActive: res.data.event.isActive !== false,
        });
      }
    } catch (err) {
      console.error("Failed to load event registrations", err);
      toast.error("Could not load event registrations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchRegistrations();
  };

  const handleExport = () => {
    if (!data?.registrations?.length) {
      toast.error("No registrations to export");
      return;
    }

    const headers = [
      "Name",
      "Phone",
      "Email",
      "Amount Paid (GHS)",
      "Payment Reference",
      "Status",
      "Date Registered",
    ];

    const rows = [
      headers,
      ...data.registrations.map((r) => [
        r.fullName,
        r.phone,
        r.email || "",
        r.amountPaid,
        r.paymentReference,
        r.status,
        new Date(r.createdAt).toLocaleString(),
      ]),
    ];

    downloadCsv(
      rows,
      `ai-masterclass-attendees-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    toast.success("Attendee list exported to CSV!");
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await adminApi.updateEvent("ai-video-masterclass", eventSettings);
      toast.success("Event settings updated successfully!");
      setEditModalOpen(false);
      fetchRegistrations();
    } catch (err) {
      console.error("Failed to update event settings", err);
      toast.error(err.response?.data?.message || "Failed to update settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  const stats = data?.stats || {
    totalRegistrations: 0,
    confirmedParticipants: 0,
    totalRevenue: 0,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Video className="w-6 h-6 text-brand-600" />
            AI Video Masterclass
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            View registered participants, manage WhatsApp invite link, and track revenue.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setEditModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 text-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-50 transition shadow-sm"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span>Event Settings</span>
          </button>
          <button
            onClick={handleExport}
            disabled={!data?.registrations?.length}
            className="flex items-center gap-2 rounded-xl bg-brand-600 text-white px-4 py-2 text-sm font-medium hover:bg-brand-700 transition shadow-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Confirmed Attendees
              </p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">
                {stats.confirmedParticipants}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {stats.totalRegistrations} total initiated
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Revenue
              </p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">
                GH₵ {stats.totalRevenue.toFixed(2)}
              </h3>
              <p className="text-xs text-emerald-600 font-medium mt-1">
                Verified Paystack earnings
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Ticket Price
              </p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">
                GH₵ {(data?.event?.price || 20).toFixed(2)}
              </h3>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${data?.event?.isActive ? "bg-emerald-500" : "bg-slate-400"}`}></span>
                <span>{data?.event?.isActive ? "Registration Active" : "Registration Closed"}</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Tag className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter & Search */}
      <Card className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center gap-2 w-full sm:w-80"
          >
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, phone, ref..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
              />
            </div>
            <Button type="submit" variant="secondary" size="sm">
              Search
            </Button>
          </form>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-medium text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-2 focus:outline-none focus:bg-white focus:border-brand-500"
            >
              <option value="">All Registrations</option>
              <option value="confirmed">Confirmed (Paid)</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Registrations Table */}
      <Card className="overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-sm">
        {loading ? (
          <div className="p-6">
            <SkeletonTable rows={5} columns={6} />
          </div>
        ) : !data?.registrations?.length ? (
          <div className="py-12">
            <EmptyState
              icon={Users}
              title="No Registrations Found"
              description="No participants match your current filter or search criteria."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50/80 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Attendee</th>
                  <th className="px-6 py-4">WhatsApp Phone</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Reference</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {data.registrations.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">
                        {r.fullName}
                      </div>
                      {r.email && (
                        <div className="text-xs text-slate-500">{r.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-slate-800">
                      {r.phone}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      GH₵ {r.amountPaid.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      {r.paymentReference}
                    </td>
                    <td className="px-6 py-4">
                      {r.status === "confirmed" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Confirmed
                        </span>
                      ) : r.status === "pending" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {formatDate(r.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
            <div>
              Showing page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} total registrations)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Edit Event Settings Modal */}
      {editModalOpen && (
        <Modal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title="Update Masterclass Settings"
        >
          <form onSubmit={handleSaveSettings} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Event Title
              </label>
              <Input
                type="text"
                value={eventSettings.title}
                onChange={(e) =>
                  setEventSettings({ ...eventSettings, title: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                WhatsApp Group Invite Link
              </label>
              <Input
                type="url"
                placeholder="https://chat.whatsapp.com/..."
                value={eventSettings.whatsappGroupLink}
                onChange={(e) =>
                  setEventSettings({
                    ...eventSettings,
                    whatsappGroupLink: e.target.value,
                  })
                }
                required
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                This WhatsApp link is automatically presented to attendees right after their 20 GHS payment is confirmed.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ticket Price (GH₵)
              </label>
              <Input
                type="number"
                step="0.5"
                min="1"
                value={eventSettings.price}
                onChange={(e) =>
                  setEventSettings({ ...eventSettings, price: e.target.value })
                }
                required
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isActiveToggle"
                checked={eventSettings.isActive}
                onChange={(e) =>
                  setEventSettings({
                    ...eventSettings,
                    isActive: e.target.checked,
                  })
                }
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4"
              />
              <label
                htmlFor="isActiveToggle"
                className="text-sm font-medium text-slate-800 cursor-pointer"
              >
                Registration Open (Active)
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={savingSettings}
                className="bg-brand-600 hover:bg-brand-700 text-white"
              >
                {savingSettings ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
