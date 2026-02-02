import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Eye, EyeOff, Mail, Lock, User, Phone, UserCheck } from "lucide-react";
import { Button } from "../../components/ui";
import { registerSchema } from "../../utils/validators";
import { useRegister } from "../../hooks";
import { ordersApi } from "../../api";

export default function RegisterPage() {
  const { code } = useParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const isSubAgentRegistration = !!code;

  const registerMutation = useRegister();

  // Fetch agent info if referral code is present
  const { data: agentData } = useQuery({
    queryKey: ["agentInfo", code],
    queryFn: () => ordersApi.getSellerInfo(code),
    enabled: !!code,
  });

  const agentName = agentData?.data?.seller?.name;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      referralCode: code || "",
    },
  });

  // Auto-fill referral code if provided in URL
  useEffect(() => {
    if (code) {
      setValue("referralCode", code);
    }
  }, [code, setValue]);

  const onSubmit = (data) => {
    // Remove confirmPassword before sending
    const { confirmPassword: _confirmPassword, referralCode, ...registerData } = data;
    
    // If referral code is present, register as sub-agent, otherwise as agent
    const role = referralCode ? "sub_agent" : "agent";
    
    registerMutation.mutate({ 
      ...registerData, 
      role,
      referralCode: referralCode || undefined,
    });
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Create an account</h1>
        <p className="text-slate-600 mt-2">
          Start selling data bundles and earning commissions today
        </p>
        {isSubAgentRegistration && agentName && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800">
              <UserCheck className="w-4 h-4" />
              <p className="text-sm font-medium">
                Referred by <span className="font-semibold">{agentName}</span>
              </p>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="John Doe"
              className={`w-full h-11 pl-10 pr-4 rounded-lg border bg-white text-sm
                focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900
                ${errors.name ? "border-red-500" : "border-slate-200"}`}
              {...register("name")}
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Email address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="email"
              placeholder="you@example.com"
              className={`w-full h-11 pl-10 pr-4 rounded-lg border bg-white text-sm
                focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900
                ${errors.email ? "border-red-500" : "border-slate-200"}`}
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Phone Number
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="tel"
              placeholder="0241234567"
              className={`w-full h-11 pl-10 pr-4 rounded-lg border bg-white text-sm
                focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900
                ${errors.phone ? "border-red-500" : "border-slate-200"}`}
              {...register("phone")}
            />
          </div>
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className={`w-full h-11 pl-10 pr-12 rounded-lg border bg-white text-sm
                focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900
                ${errors.password ? "border-red-500" : "border-slate-200"}`}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              className={`w-full h-11 pl-10 pr-12 rounded-lg border bg-white text-sm
                focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900
                ${errors.confirmPassword ? "border-red-500" : "border-slate-200"}`}
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Hidden referral code field for sub-agent registration via URL */}
        {isSubAgentRegistration && (
          <input type="hidden" {...register("referralCode")} />
        )}

        {/* Terms */}
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="terms"
            className="w-4 h-4 mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            required
          />
          <label htmlFor="terms" className="text-sm text-slate-600">
            I agree to the{" "}
            <Link to="/terms" className="text-slate-900 hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-slate-900 hover:underline">
              Privacy Policy
            </Link>
          </label>
        </div>

        <Button
          type="submit"
          className="w-full h-11"
          isLoading={registerMutation.isPending}
        >
          Create account
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-slate-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-slate-900 hover:text-slate-700"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
