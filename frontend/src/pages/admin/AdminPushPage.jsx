import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Send, Users, UserCheck, Bell, MessageSquare, ListFilter, Globe } from "lucide-react";
import { Card, Button, Input } from "../../components/ui";
import { adminApi } from "../../api";
import toast from "react-hot-toast";

export default function AdminPushPage() {
  const [target, setTarget] = useState("all_agents");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const sendPushMutation = useMutation({
    mutationFn: (data) => adminApi.sendPushNotification(data),
    onSuccess: (res) => {
      const stats = res?.data?.data || {};
      toast.success(
        `Push notification broadcast initiated! Successfully sent to ${stats.successCount || 0} browser(s).`
      );
      setTitle("");
      setBody("");
      setUrl("");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to broadcast push notification.");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Notification title cannot be empty.");
      return;
    }
    if (!body.trim()) {
      toast.error("Notification body cannot be empty.");
      return;
    }
    if (target === "order_status" && !orderStatus) {
      toast.error("Please select an order status.");
      return;
    }

    sendPushMutation.mutate({
      target,
      title: title.trim(),
      body: body.trim(),
      url: url.trim() || undefined,
      orderStatus: target === "order_status" ? orderStatus : undefined,
      startDate: target === "order_status" && startDate ? startDate : undefined,
      endDate: target === "order_status" && endDate ? endDate : undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Push Notifications
        </h1>
        <p className="text-slate-500">
          Send native web push alerts directly to your customers' and agents' devices.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Target Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Select Recipients
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {[
                    { id: "all_agents", label: "All Agents", icon: Users },
                    { id: "active_agents", label: "Active Agents", icon: UserCheck },
                    { id: "all_customers", label: "All Customers", icon: Users },
                    { id: "both", label: "Everyone (Both)", icon: Globe },
                    { id: "order_status", label: "By Order Status", icon: ListFilter },
                  ].map((option) => {
                    const Icon = option.icon;
                    const isActive = target === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setTarget(option.id)}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                          isActive
                            ? "border-indigo-600 bg-indigo-50/50 text-indigo-700"
                            : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50 text-slate-600"
                        }`}
                      >
                        <Icon className={`w-6 h-6 mb-2 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                        <span className="text-xs font-semibold text-center">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Order Status Inputs */}
              {target === "order_status" && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Select Order Status
                    </label>
                    <select
                      value={orderStatus}
                      onChange={(e) => setOrderStatus(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 p-2.5 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                      required
                    >
                      <option value="" disabled>Select a status</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Start Date (Optional)"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                    <Input
                      label="End Date (Optional)"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Title & Click URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Notification Title"
                  placeholder="e.g. System Maintenance"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
                <Input
                  label="Click Redirect URL (Optional)"
                  placeholder="e.g. /dashboard or /orders"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>

              {/* Message Body */}
              <div>
                <label htmlFor="body" className="block text-sm font-medium text-slate-700 mb-1">
                  Notification Body Message
                </label>
                <textarea
                  id="body"
                  className="w-full h-28 rounded-lg border border-slate-300 p-3 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-shadow resize-none"
                  placeholder="Type notification description details here..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-2 border-t border-slate-100">
                <Button
                  type="submit"
                  disabled={sendPushMutation.isPending}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {sendPushMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Broadcasting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Push Alert
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Info Sidebar */}
        <div>
          <Card className="p-6 bg-slate-50 border-none shadow-inner space-y-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-600" />
              Browser Push Info
            </h3>
            <ul className="text-sm text-slate-600 space-y-3">
              <li>
                <span className="font-medium text-slate-900 block">Deliverability:</span>
                Push alerts are delivered directly to the operating system notification tray, even if the user does not have the website currently open.
              </li>
              <li>
                <span className="font-medium text-slate-900 block">Permissions Required:</span>
                Users must have accepted the browser alert request popup. If permission is blocked, notifications cannot be delivered.
              </li>
              <li>
                <span className="font-medium text-slate-900 block">Automatic Cleanup:</span>
                Stale, expired, or revoked subscription channels are automatically purged from the database upon failed deliveries.
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
