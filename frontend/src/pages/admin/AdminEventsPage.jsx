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
import { formatDate } from "../../utils/formatters";
import {
  Video,
  Search,
  Download,
  Users,
  CheckCircle2,
  Clock,
  DollarSign,
  Settings,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
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
    price: 10,
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
          price: res.data.event.price || 10,
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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Video className="w-6 h-6 text-violet-400" />
              AI Video Masterclass Registrations
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Track paid participants, manage WhatsApp invite link, and monitor event revenue.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => setEditModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            <span>Event Settings</span>
          </Button>
          <Button
            variant="primary"
            onClick={handleExport}
            disabled={!data?.registrations?.length}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 bg-slate-900/60 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Confirmed Attendees
              </p>
              <h3 className="text-3xl font-bold text-slate-100 mt-1">
                {stats.confirmedParticipants}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {stats.totalRegistrations} total initiated
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-slate-900/60 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Revenue
              </p>
              <h3 className="text-3xl font-bold text-emerald-400 mt-1">
                GH₵ {stats.totalRevenue.toFixed(2)}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                From verified Paystack payments
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-slate-900/60 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Ticket Price
              </p>
              <h3 className="text-3xl font-bold text-slate-100 mt-1">
                GH₵ {(data?.event?.price || 10).toFixed(2)}
              </h3>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Event is {data?.event?.isActive ? "Live / Active" : "Closed"}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter & Search */}
      <Card className="p-4 bg-slate-900/60 border-slate-800">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center gap-2 w-full sm:w-80"
          >
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, phone, ref..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-violet-500"
              />
            </div>
            <Button type="submit" variant="secondary" size="sm">
              Search
            </Button>
          </form>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-violet-500"
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
      <Card className="bg-slate-900/60 border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-6">
            <SkeletonTable rows={5} columns={6} />
          </div>
        ) : !data?.registrations?.length ? (
          <div className="py-12">
            <EmptyState
              icon={Users}
              title="No Registrations Found"
              description="No participants match your current search criteria."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Attendee</th>
                  <th className="px-5 py-3.5">Phone (WhatsApp)</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Reference</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Registered At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.registrations.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-100">
                        {r.fullName}
                      </div>
                      {r.email && (
                        <div className="text-xs text-slate-400">{r.email}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-200">
                      {r.phone}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-100">
                      GH₵ {r.amountPaid.toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-400">
                      {r.paymentReference}
                    </td>
                    <td className="px-5 py-3.5">
                      {r.status === "confirmed" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Confirmed
                        </span>
                      ) : r.status === "pending" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Clock className="w-3.5 h-3.5" />
                          Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">
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
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Page {data.pagination.page} of {data.pagination.totalPages} (
              {data.pagination.total} total)
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
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
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
              <label className="block text-xs font-semibold text-slate-300 mb-1">
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
              <span className="text-[11px] text-slate-400 mt-1 block">
                This link will be displayed to attendees immediately upon successful 10 GHS payment.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
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
                className="rounded border-slate-700 bg-slate-800 text-violet-600 focus:ring-violet-500"
              />
              <label
                htmlFor="isActiveToggle"
                className="text-sm text-slate-200 cursor-pointer"
              >
                Registration Open (Active)
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
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
                className="bg-violet-600 hover:bg-violet-700 text-white"
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
