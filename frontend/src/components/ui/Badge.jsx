import { cn } from "../../utils/helpers";

const badgeVariants = {
  default: "bg-slate-100 text-slate-700",
  primary: "bg-brand-100 text-brand-700",
  secondary: "bg-slate-100 text-slate-600",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-red-100 text-red-700",
  purple: "bg-sky-100 text-sky-700",
};

const badgeSizes = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-0.5 text-sm",
  lg: "px-3 py-1 text-sm",
};

export default function Badge({
  children,
  variant = "default",
  size = "md",
  className,
  ...props
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        badgeVariants[variant],
        badgeSizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
