import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Mail, Lock, User, Phone, Users } from "lucide-react";
import { Button } from "../../components/ui";
import { registerSchema } from "../../utils/validators";
import { useRegister } from "../../hooks";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      role: "agent",
    },
  });

  // Using state for role selection to avoid React Compiler warning with watch()
  const [selectedRole, setSelectedRole] = useState("agent");

  const onSubmit = (data) => {
    // Remove confirmPassword before sending (eslint-disable-next-line)
    const { confirmPassword: _confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Create an account</h1>
        <p className="text-slate-600 mt-2">
          Start selling data bundles and earning commissions today
        </p>
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

        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Account Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label
              className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                ${
                  selectedRole === "agent"
                    ? "border-slate-900 bg-slate-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
            >
              <input
                type="radio"
                value="agent"
                className="sr-only"
                {...register("role", {
                  onChange: (e) => setSelectedRole(e.target.value),
                })}
              />
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center
                ${selectedRole === "agent" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`}
              >
                <User className="h-4 w-4" />
              </div>
              <div>
                <div className="font-medium text-sm text-slate-900">Agent</div>
                <div className="text-xs text-slate-500">Sell directly</div>
              </div>
            </label>

            <label
              className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                ${
                  selectedRole === "sub_agent"
                    ? "border-slate-900 bg-slate-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
            >
              <input
                type="radio"
                value="sub_agent"
                className="sr-only"
                {...register("role", {
                  onChange: (e) => setSelectedRole(e.target.value),
                })}
              />
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center
                ${selectedRole === "sub_agent" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`}
              >
                <Users className="h-4 w-4" />
              </div>
              <div>
                <div className="font-medium text-sm text-slate-900">
                  Sub-Agent
                </div>
                <div className="text-xs text-slate-500">Work with agent</div>
              </div>
            </label>
          </div>
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
