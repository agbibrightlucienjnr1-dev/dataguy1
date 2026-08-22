import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Smartphone, ShieldAlert, Server, Webhook } from "lucide-react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
  Button,
  Spinner 
} from "../../components/ui";
import { authApi } from "../../api";
import { useAuthStore } from "../../stores";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { isAdmin } = useAuthStore();

  const { data: profileResponse, isLoading } = useQuery({
    queryKey: ["auth", "profile"],
    queryFn: () => authApi.getProfile()
  });

  const [preferences, setPreferences] = useState({
    notifyNewOrders: true,
    notifyWithdrawals: true,
    notifySystemAlerts: false,
    smsAlerts: false,
  });

  useEffect(() => {
    if (profileResponse?.data?.user?.preferences) {
      setPreferences(prev => ({
        ...prev,
        ...profileResponse.data.user.preferences
      }));
    }
  }, [profileResponse]);

  const updatePreferencesMutation = useMutation({
    mutationFn: (newPrefs) => authApi.updatePreferences(newPrefs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "profile"] });
      toast.success("Preferences updated successfully");
    },
    onError: () => {
      toast.error("Failed to update preferences");
    }
  });

  const handleToggle = (key) => {
    const newPrefs = { ...preferences, [key]: !preferences[key] };
    setPreferences(newPrefs);
    updatePreferencesMutation.mutate(newPrefs);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600 mt-1">
          Manage your notification preferences and active system configurations.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-brand-600" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Control what alerts you receive and how we deliver them.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <p className="font-medium text-slate-900">New Order Alerts</p>
                <p className="text-sm text-slate-500">Receive notifications when a new order is placed</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={preferences.notifyNewOrders}
                  onChange={() => handleToggle("notifyNewOrders")}
                  disabled={updatePreferencesMutation.isPending}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <p className="font-medium text-slate-900">Withdrawal Updates</p>
                <p className="text-sm text-slate-500">Get notified when withdrawal requests are processed</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={preferences.notifyWithdrawals}
                  onChange={() => handleToggle("notifyWithdrawals")}
                  disabled={updatePreferencesMutation.isPending}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-slate-500" />
                  <p className="font-medium text-slate-900">SMS Alerts</p>
                </div>
                <p className="text-sm text-slate-500">Receive critical alerts via SMS</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={preferences.smsAlerts}
                  onChange={() => handleToggle("smsAlerts")}
                  disabled={updatePreferencesMutation.isPending}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
              </label>
            </div>

          </CardContent>
        </Card>

        {/* Admin Platform Config */}
        {isAdmin() && (
          <Card className="border-brand-100 shadow-sm shadow-brand-100">
            <CardHeader className="bg-brand-50/50 border-b border-brand-100 rounded-t-2xl">
              <CardTitle className="flex items-center gap-2 text-brand-900">
                <Server className="w-5 h-5 text-brand-600" />
                Global Platform Configuration
              </CardTitle>
              <CardDescription>
                System-level environment variables and API integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              
              <div className="p-4 border border-slate-200 rounded-xl bg-white">
                 <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                       <Webhook className="w-5 h-5 text-slate-400 mt-0.5" />
                       <div>
                         <p className="font-medium text-slate-900">Hubnet API Integration</p>
                         <p className="text-sm text-slate-500 mt-1">Status of the Hubnet wholesale data connection.</p>
                       </div>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-action-100 text-action-800">
                      Active
                    </span>
                 </div>
              </div>

              <div className="p-4 border border-slate-200 rounded-xl bg-white">
                 <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                       <ShieldAlert className="w-5 h-5 text-slate-400 mt-0.5" />
                       <div>
                         <p className="font-medium text-slate-900">Maintenance Mode</p>
                         <p className="text-sm text-slate-500 mt-1">Suspends all storefront purchases and API routes.</p>
                       </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-not-allowed opacity-50">
                      <input type="checkbox" className="sr-only peer" disabled />
                      <div className="w-11 h-6 bg-slate-200 rounded-full"></div>
                    </label>
                 </div>
                 <p className="text-xs text-slate-500 mt-3 flex justify-end">Modifiable only via .env file</p>
              </div>

            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
