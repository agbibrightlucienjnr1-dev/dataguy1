import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, User, Mail, Phone, Key, Store } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
} from "../../components/ui";
import Input from "../../components/ui/Input";
import { changePasswordSchema } from "../../utils/validators";
import { useChangePassword, useAuth, useUpdateShopName } from "../../hooks";
import { formatDate } from "../../utils/formatters";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "../../api";
import { queryKeys } from "../../lib";
import { Spinner } from "../../components/ui";

export default function ProfilePage() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [shopName, setShopName] = useState("");
  const [isEditingShopName, setIsEditingShopName] = useState(false);

  const { user: authUser } = useAuth();
  const changePasswordMutation = useChangePassword();
  const updateShopNameMutation = useUpdateShopName();

  // Fetch full user profile
  const { data: profileData, isLoading } = useQuery({
    queryKey: queryKeys.auth.profile,
    queryFn: authApi.getProfile,
    select: (response) => response.data?.user,
  });

  const user = profileData || authUser;

  // Initialize shop name when user data loads
  if (user?.shopName && !shopName && !isEditingShopName) {
    setShopName(user.shopName);
  }

  const handleUpdateShopName = () => {
    updateShopNameMutation.mutate(shopName || null, {
      onSuccess: () => {
        setIsEditingShopName(false);
      },
    });
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data) => {
    changePasswordMutation.mutate(
      {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      },
      {
        onSuccess: () => {
          reset(); // Clear form after successful password change
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="text-slate-600 mt-1">
          Manage your account information and security settings
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Your account details and information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-900">
                    {user?.name || "N/A"}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-900">
                    {user?.email || "N/A"}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Phone Number
                </label>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-900">
                    {user?.phone || "N/A"}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Role
                </label>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-blue-100 text-blue-800">
                    {user?.role || "N/A"}
                  </span>
                </div>
              </div>

              {user?.paymentLinkCode && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Payment Link Code
                  </label>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <code className="text-sm font-mono text-slate-900">
                      {user.paymentLinkCode}
                    </code>
                  </div>
                </div>
              )}

              {user?.createdAt && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Member Since
                  </label>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-sm text-slate-900">
                      {formatDate(user.createdAt)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shop Name (for agents and sub-agents only) */}
          {(user?.role === "agent" || user?.role === "sub_agent") && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  Shop Name
                </CardTitle>
                <CardDescription>
                  Set a custom shop name to display on your buy page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Shop Display Name
                  </label>
                  <Input
                    value={shopName}
                    onChange={(e) => {
                      setShopName(e.target.value);
                      setIsEditingShopName(true);
                    }}
                    placeholder={user?.name || "Enter shop name"}
                    icon={Store}
                  />
                  <p className="mt-1 text-sm text-slate-500">
                    {user?.shopName
                      ? "Your current shop name is displayed on your buy page"
                      : "If not set, your account name will be shown"}
                  </p>
                </div>

                <Button
                  onClick={handleUpdateShopName}
                  variant="primary"
                  className="w-full"
                  disabled={
                    updateShopNameMutation.isPending ||
                    (!isEditingShopName && shopName === (user?.shopName || ""))
                  }
                >
                  {updateShopNameMutation.isPending ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Updating...
                    </>
                  ) : (
                    "Update Shop Name"
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Change Password
            </CardTitle>
            <CardDescription>
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-10 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-50"
                    {...register("currentPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.currentPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-10 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-50"
                    {...register("newPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.newPassword.message}
                  </p>
                )}
                {!errors.newPassword && (
                  <p className="mt-1 text-sm text-gray-500">
                    Must be at least 12 characters with uppercase, lowercase,
                    number, and special character
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-10 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-50"
                    {...register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Changing Password...
                  </>
                ) : (
                  "Change Password"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
