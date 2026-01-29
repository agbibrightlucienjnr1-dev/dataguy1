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
        <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
        <p className="text-slate-600 mt-2">
          Sign in to your account to continue selling
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span className="text-sm text-slate-600">Remember me</span>
          </label>
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-slate-900 hover:text-slate-700"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full h-11"
          isLoading={loginMutation.isPending}
        >
          Sign in
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-slate-600">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-medium text-slate-900 hover:text-slate-700"
          >
            Create account
          </Link>
        </p>
      </div>

      {/* Demo credentials hint */}
      <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-slate-100">
        <p className="text-xs text-slate-500 text-center">
          <span className="font-medium">Demo:</span> 0241234567 / Password123!
        </p>
      </div>
    </div>
  );
}
