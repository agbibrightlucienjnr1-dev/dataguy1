import { useState, useEffect } from "react";
import { Bell, X, ShieldAlert } from "lucide-react";
import { Modal, Button } from "./index";
import { isPushSupported, getNotificationPermissionState, subscribeUserToPush } from "../../utils/pushNotifications";
import toast from "react-hot-toast";

export default function PushNotificationPrompt({
  title = "Stay Instantly Updated",
  description = "Enable browser notifications to receive real-time updates for commission payouts, system notices, and order updates.",
  role = "customer",
  phone = null,
  triggerDelayMs = 2500 // Delay popup to not annoy visitors immediately
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    // Only prompt if push is supported and permission state is still default (not yet granted/denied)
    if (!isPushSupported() || getNotificationPermissionState() !== "default") {
      return;
    }

    // Check session storage so we don't spam the user repeatedly in a single browsing session
    const hasPrompted = sessionStorage.getItem("push_prompted");
    if (hasPrompted) return;

    const timer = setTimeout(() => {
      setIsOpen(true);
      sessionStorage.setItem("push_prompted", "true");
    }, triggerDelayMs);

    return () => clearTimeout(timer);
  }, [triggerDelayMs]);

  const handleSubscribe = async () => {
    setIsPending(true);
    try {
      if (getNotificationPermissionState() === "denied") {
        throw new Error("Notifications are blocked in your browser settings. Please click the lock or settings icon in your address bar and change Notifications to 'Allow'.");
      }
      await subscribeUserToPush(phone, role);
      toast.success("Notifications enabled successfully! 🔔");
      setIsOpen(false);
    } catch (error) {
      console.error("Subscription failed:", error);
      if (error.message && error.message.includes("permission denied")) {
        toast.error("Permission denied. To allow alerts, please click the lock/settings icon in the address bar and set Notifications to 'Allow'.");
      } else {
        toast.error(error.message || "Failed to enable notifications.");
      }
    } finally {
      setIsPending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="Enable Alerts"
      size="sm"
    >
      <div className="space-y-5 text-center p-2">
        <div className="mx-auto w-14 h-14 rounded-full bg-violet-50 border border-violet-100 flex items-center justify-center text-brand-600 animate-bounce">
          <Bell className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h3 className="font-display text-lg font-bold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-left flex gap-3 text-xs text-amber-800">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-600" />
          <p>
            You can modify or mute these notifications anytime in your browser settings. We only send relevant, actionable updates.
          </p>
        </div>

        <div className="pt-3 flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="w-full sm:flex-1 order-2 sm:order-1"
            disabled={isPending}
          >
            No thanks
          </Button>
          <Button
            variant="primary"
            onClick={handleSubscribe}
            className="w-full sm:flex-1 order-1 sm:order-2"
            disabled={isPending}
          >
            {isPending ? "Enabling..." : "Enable Notifications"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
