import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Phone, Key, Lock, CheckCircle } from "lucide-react";
import { Button } from "../../components/ui";
import {
  forgotPasswordSchema,
  passwordResetSchema,
} from "../../utils/validators";
import { useForgotPassword, useResetPassword } from "../../hooks";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState("request"); // "request" | "reset" | "success"

  const navigate = useNavigate();
  const forgotPasswordMutation = useForgotPassword();
  const resetPasswordMutation = useResetPassword();

  const requestForm = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      phone: "",
    },
  });

  const resetForm = useForm({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      phone: "",
      code: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onRequestSubmit = (data) => {
    forgotPasswordMutation.mutate(data, {
      onSuccess: () => {
        setStep("reset");
        resetForm.setValue("phone", data.phone);
      },
    });
  };

  const onResetSubmit = (data) => {
    resetPasswordMutation.mutate(data, {
      onSuccess: () => {
        setStep("success");
      },
    });
  };

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/60">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Password Reset Successful
            </h1>
            <p className="text-slate-600 mb-6">
              Your password has been reset successfully. You can now log in with
              your new password.
            </p>
            <Button
              onClick={() => navigate("/login")}
              className="w-full h-12 text-[15px] font-bold shadow-slate-900/20 shadow-lg hover:-translate-y-0.5 transition-all bg-slate-900 hover:bg-slate-800 text-white border-0"
            >
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/60">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">
            {step === "request" ? "Forgot Password" : "Reset Password"}
          </h1>
          <p className="text-slate-600 mt-2">
            {step === "request"
              ? "Enter your phone number to receive a reset code"
              : "Enter the code sent to your phone and your new password"}
          </p>
        </div>

        {step === "request" ? (
          <form
            onSubmit={requestForm.handleSubmit(onRequestSubmit)}
            className="space-y-6"
          >
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Phone Number
              </label>
              <div className="relative group">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                <input
                  type="tel"
                  placeholder="0241234567"
                  className={`w-full h-12 pl-11 pr-4 rounded-xl border bg-white/50 backdrop-blur-sm text-sm shadow-sm transition-all duration-200
                    focus:outline-none focus:ring-4 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white
                    hover:border-slate-300
                    ${requestForm.formState.errors.phone ? "border-red-500 focus:ring-red-500/10 focus:border-red-500" : "border-slate-200"}`}
                  {...requestForm.register("phone")}
                />
              </div>
              {requestForm.formState.errors.phone && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-red-600"></span>
                  {requestForm.formState.errors.phone.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-[15px] font-bold shadow-slate-900/20 shadow-lg hover:-translate-y-0.5 transition-all bg-slate-900 hover:bg-slate-800 text-white border-0"
              isLoading={forgotPasswordMutation.isPending}
            >
              Send Reset Code
            </Button>
          </form>
        ) : (
          <form
            onSubmit={resetForm.handleSubmit(onResetSubmit)}
            className="space-y-6"
          >
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Phone Number
              </label>
              <div className="relative group">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                <input
                  type="tel"
                  placeholder="0241234567"
                  className={`w-full h-12 pl-11 pr-4 rounded-xl border bg-white/50 backdrop-blur-sm text-sm shadow-sm transition-all duration-200
                    focus:outline-none focus:ring-4 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white
                    hover:border-slate-300
                    ${resetForm.formState.errors.phone ? "border-red-500 focus:ring-red-500/10 focus:border-red-500" : "border-slate-200"}`}
                  {...resetForm.register("phone")}
                />
              </div>
              {resetForm.formState.errors.phone && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-red-600"></span>
                  {resetForm.formState.errors.phone.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Reset Code
              </label>
              <div className="relative group">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                <input
                  type="text"
                  placeholder="1234"
                  maxLength={4}
                  className={`w-full h-12 pl-11 pr-4 rounded-xl border bg-white/50 backdrop-blur-sm text-sm shadow-sm transition-all duration-200
                    focus:outline-none focus:ring-4 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white
                    hover:border-slate-300
                    ${resetForm.formState.errors.code ? "border-red-500 focus:ring-red-500/10 focus:border-red-500" : "border-slate-200"}`}
                  {...resetForm.register("code")}
                />
              </div>
              {resetForm.formState.errors.code && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-red-600"></span>
                  {resetForm.formState.errors.code.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                New Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                <input
                  type="password"
                  placeholder="••••••••"
                  className={`w-full h-12 pl-11 pr-4 rounded-xl border bg-white/50 backdrop-blur-sm text-sm shadow-sm transition-all duration-200
                    focus:outline-none focus:ring-4 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white
                    hover:border-slate-300
                    ${resetForm.formState.errors.newPassword ? "border-red-500 focus:ring-red-500/10 focus:border-red-500" : "border-slate-200"}`}
                  {...resetForm.register("newPassword")}
                />
              </div>
              {resetForm.formState.errors.newPassword && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-red-600"></span>
                  {resetForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                <input
                  type="password"
                  placeholder="••••••••"
                  className={`w-full h-12 pl-11 pr-4 rounded-xl border bg-white/50 backdrop-blur-sm text-sm shadow-sm transition-all duration-200
                    focus:outline-none focus:ring-4 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white
                    hover:border-slate-300
                    ${resetForm.formState.errors.confirmPassword ? "border-red-500 focus:ring-red-500/10 focus:border-red-500" : "border-slate-200"}`}
                  {...resetForm.register("confirmPassword")}
                />
              </div>
              {resetForm.formState.errors.confirmPassword && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-red-600"></span>
                  {resetForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("request")}
                className="flex-1 h-12 text-[15px] font-semibold"
              >
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 text-[15px] font-bold shadow-slate-900/20 shadow-lg hover:-translate-y-0.5 transition-all bg-slate-900 hover:bg-slate-800 text-white border-0"
                isLoading={resetPasswordMutation.isPending}
              >
                Reset Password
              </Button>
            </div>
          </form>
        )}

        <div className="mt-8 text-center">
          <p className="text-slate-600 text-sm">
            Remember your password?{" "}
            <Link
              to="/login"
              className="font-medium text-slate-900 hover:text-slate-700"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
