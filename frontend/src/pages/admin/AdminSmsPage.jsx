import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Send, Users, UserCheck, MessageSquare, Phone, ListFilter } from "lucide-react";
import { Card, Button, Input } from "../../components/ui";
import { adminApi } from "../../api";
import toast from "react-hot-toast";

export default function AdminSmsPage() {
  const [target, setTarget] = useState("all_customers");
  const [customNumber, setCustomNumber] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [message, setMessage] = useState("");

  const sendSmsMutation = useMutation({
    mutationFn: (data) => adminApi.sendSMS(data),
    onSuccess: (res) => {
      toast.success(res.data?.message || "SMS dispatched successfully!");
      setMessage(""); // Clear message after success
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to send SMS.");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("Message cannot be empty.");
      return;
    }
    if (target === "specific" && !customNumber.trim()) {
      toast.error("Please provide a specific phone number.");
      return;
    }
    if (target === "order_status" && !orderStatus) {
      toast.error("Please select an order status.");
      return;
    }

    sendSmsMutation.mutate({
      target,
      customNumber: target === "specific" ? customNumber : undefined,
      orderStatus: target === "order_status" ? orderStatus : undefined,
      startDate: target === "order_status" && startDate ? startDate : undefined,
      endDate: target === "order_status" && endDate ? endDate : undefined,
      message,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          SMS Notifications
        </h1>
        <p className="text-slate-500">
          Send SMS messages to customers, agents, or a specific number.
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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { id: "all_customers", label: "All Customers", icon: Users },
                    { id: "all_agents", label: "All Agents", icon: Users },
                    { id: "active_agents", label: "Active Agents", icon: UserCheck },
                    { id: "both", label: "Everyone (Both)", icon: MessageSquare },
                    { id: "specific", label: "Specific Number", icon: Phone },
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
                            ? "border-blue-600 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50 text-slate-600"
                        }`}
                      >
                        <Icon className={`w-6 h-6 mb-2 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                        <span className="text-xs font-semibold text-center">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Specific Number Input */}
              {target === "specific" && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <Input
                    label="Phone Number"
                    placeholder="e.g. 0541234567"
                    value={customNumber}
                    onChange={(e) => setCustomNumber(e.target.value)}
                    required
                  />
                </div>
              )}

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
                      className="w-full rounded-lg border border-slate-300 p-2.5 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
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
                  <p className="text-xs text-slate-500">
                    If no dates are selected, it will send to all orders with this status.
                  </p>
                </div>
              )}

              {/* Message Input */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="message" className="block text-sm font-medium text-slate-700">
                    Message Content
                  </label>
                  <span className={`text-xs ${message.length > 160 ? "text-orange-500 font-medium" : "text-slate-400"}`}>
                    {message.length} chars {message.length > 160 && "(Might be split into multiple SMS)"}
                  </span>
                </div>
                <textarea
                  id="message"
                  className="w-full h-32 rounded-lg border border-slate-300 p-3 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition-shadow resize-none"
                  placeholder="Type your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-2 border-t border-slate-100">
                <Button
                  type="submit"
                  disabled={sendSmsMutation.isPending}
                  className="w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  {sendSmsMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send SMS
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Info Box */}
        <div>
          <Card className="p-6 bg-slate-50 border-none shadow-inner">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-slate-500" />
              SMS Info
            </h3>
            <ul className="text-sm text-slate-600 space-y-3">
              <li>
                <span className="font-medium text-slate-900 block">Sender ID:</span>
                Your registered MoolreSender ID will be used automatically.
              </li>
              <li>
                <span className="font-medium text-slate-900 block">Length limit:</span>
                Standard SMS limits are 160 characters. Longer messages will be split into multiple segments and billed accordingly.
              </li>
              <li>
                <span className="font-medium text-slate-900 block">Recipients:</span>
                Duplicates are automatically filtered out before sending.
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
