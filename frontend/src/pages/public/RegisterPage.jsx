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
      <div className="animate-fade-in-up mb-8">
        <h1 className="text-2xl font-display font-bold text-slate-900">Create an account</h1>
        <p className="text-slate-600 mt-2">
          Start selling data bundles and earning commissions today
        </p>
        {isSubAgentRegistration && agentName && (
          <div className="mt-3 p-3 bg-brand-50 border border-brand-200 rounded-xl">
            <div className="flex items-center gap-2 text-brand-800">
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
        <div className="animate-fade-in-up" style={{ animationDelay: "60ms" }}>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Full Name
          </label>
          <div className="relative group">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
            <input
              type="text"
              placeholder="John Doe"
              className={`w-full h-12 pl-11 pr-4 rounded-xl border bg-white/50 backdrop-blur-sm text-sm shadow-sm transition-all duration-200
                focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 focus:bg-white hover:border-brand-200
                ${errors.name ? "border-red-500 focus:ring-red-500/10 focus:border-red-500" : "border-slate-200"}`}
              {...register("name")}
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="animate-fade-in-up" style={{ animationDelay: "120ms" }}>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Email address
          </label>
          <div className="relative group">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
            <input
              type="email"
              placeholder="you@example.com"
              className={`w-full h-12 pl-11 pr-4 rounded-xl border bg-white/50 backdrop-blur-sm text-sm shadow-sm transition-all duration-200
                focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 focus:bg-white hover:border-brand-200
                ${errors.email ? "border-red-500 focus:ring-red-500/10 focus:border-red-500" : "border-slate-200"}`}
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Phone */}
        <div className="animate-fade-in-up" style={{ animationDelay: "180ms" }}>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Phone Number
          </label>
          <div className="relative group">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
            <input
              type="tel"
              placeholder="0241234567"
              className={`w-full h-12 pl-11 pr-4 rounded-xl border bg-white/50 backdrop-blur-sm text-sm shadow-sm transition-all duration-200
                focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 focus:bg-white hover:border-brand-200
                ${errors.phone ? "border-red-500 focus:ring-red-500/10 focus:border-red-500" : "border-slate-200"}`}
              {...register("phone")}
            />
          </div>
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="animate-fade-in-up" style={{ animationDelay: "240ms" }}>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Password
          </label>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              className={`w-full h-12 pl-11 pr-12 rounded-xl border bg-white/50 backdrop-blur-sm text-sm shadow-sm transition-all duration-200
                focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 focus:bg-white hover:border-brand-200
                ${errors.password ? "border-red-500 focus:ring-red-500/10 focus:border-red-500" : "border-slate-200"}`}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-600 transition-colors"
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
          {!errors.password && (
            <p className="mt-1.5 text-xs text-slate-500">
              Must be at least 12 characters with uppercase, lowercase, number, and special character
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Confirm Password
          </label>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Re-enter your password"
              className={`w-full h-12 pl-11 pr-12 rounded-xl border bg-white/50 backdrop-blur-sm text-sm shadow-sm transition-all duration-200
                focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 focus:bg-white hover:border-brand-200
                ${errors.confirmPassword ? "border-red-500 focus:ring-red-500/10 focus:border-red-500" : "border-slate-200"}`}
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-600 transition-colors"
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
        <div className="animate-fade-in-up flex items-start gap-2 pt-2" style={{ animationDelay: "360ms" }}>
          <input
            type="checkbox"
            id="terms"
            className="w-4 h-4 mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 transition-colors cursor-pointer"
            required
          />
          <label htmlFor="terms" className="text-sm text-slate-600">
            I agree to the{" "}
            <Link to="/terms" className="font-semibold text-brand-600 hover:text-brand-700 transition-colors">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="font-semibold text-brand-600 hover:text-brand-700 transition-colors">
              Privacy Policy
            </Link>
          </label>
        </div>

        <Button
          type="submit"
          className="shimmer-sweep animate-fade-in-up w-full h-12 text-[15px] hover:-translate-y-0.5 mt-2"
          style={{ animationDelay: "420ms" }}
          isLoading={registerMutation.isPending}
        >
          Create Account
        </Button>
      </form>

      <div className="animate-fade-in-up mt-8 text-center bg-brand-50/50 p-4 rounded-xl border border-brand-100" style={{ animationDelay: "480ms" }}>
        <p className="text-slate-600 text-sm">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-brand-600 hover:text-brand-700 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
