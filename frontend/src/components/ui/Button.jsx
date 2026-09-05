import { forwardRef } from "react";
import { cn } from "../../utils/helpers";
import { Loader2 } from "lucide-react";

const variants = {
  primary:
    "bg-brand-600 text-white shadow-sm shadow-brand-600/30 hover:bg-brand-700 hover:shadow-brand-600/40 focus:ring-brand-500",
  secondary:
    "bg-brand-50 text-brand-700 hover:bg-brand-100 focus:ring-brand-400",
  success:
    "bg-action-600 text-white shadow-sm shadow-action-600/30 hover:bg-action-700 hover:shadow-action-600/40 focus:ring-action-500",
  danger:
    "bg-red-600 text-white shadow-sm shadow-red-600/20 hover:bg-red-700 focus:ring-red-500",
  warning:
    "bg-amber-500 text-white shadow-sm shadow-amber-500/20 hover:bg-amber-600 focus:ring-amber-500",
  outline:
    "border border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50/60 hover:text-brand-700 focus:ring-brand-400",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-400",
  link: "text-brand-600 hover:text-brand-700 underline-offset-4 hover:underline",
};

const sizes = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "h-10 w-10",
};

const Button = forwardRef(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled = false,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 active:scale-[0.98]",
          "focus:outline-none focus:ring-2 focus:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
