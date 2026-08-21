import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Phone, Lock } from "lucide-react";
import { Button } from "../../components/ui";
import { loginSchema } from "../../utils/validators";
import { useLogin } from "../../hooks";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  });

  const onSubmit = (data) => {
    loginMutation.mutate(data);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-slate-900">Welcome back</h1>
        <p className="text-slate-600 mt-2">
          Sign in to your account to continue selling
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Phone Number
          </label>
          <div className="relative group">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
            <input
              type="tel"
              placeholder="0241234567"
              className={`w-full h-12 pl-11 pr-4 rounded-xl border bg-white/50 backdrop-blur-sm text-sm shadow-sm transition-all duration-200
                focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 focus:bg-white
                hover:border-brand-200
                ${errors.phone ? "border-red-500 focus:ring-red-500/10 focus:border-red-500" : "border-slate-200"}`}
              {...register("phone")}
            />
          </div>
          {errors.phone && (
            <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-red-600"></span>{errors.phone.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Password
          </label>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
            <input
               type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className={`w-full h-12 pl-11 pr-12 rounded-xl border bg-white/50 backdrop-blur-sm text-sm shadow-sm transition-all duration-200
                focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 focus:bg-white
                hover:border-brand-200
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
            <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-red-600"></span>{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 transition-colors cursor-pointer"
            />
            <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">Remember me</span>
          </label>
          <Link
            to="/forgot-password"
            className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full h-12 text-[15px] hover:-translate-y-0.5"
          isLoading={loginMutation.isPending}
        >
          Sign in to Dashboard
        </Button>
      </form>

      <div className="mt-8 text-center bg-brand-50/50 p-4 rounded-xl border border-brand-100">
        <p className="text-slate-600 text-sm">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-medium text-brand-600 hover:text-brand-700"
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
