import { Loader2 } from "lucide-react";
import { cn } from "../../utils/helpers";

const sizes = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
};

export default function Spinner({ size = "md", className, ...props }) {
  return (
    <Loader2
      className={cn("animate-spin text-brand-600", sizes[size], className)}
      {...props}
    />
  );
}

export function LoadingScreen({ message = "Loading..." }) {
  return (
    <div className="flex min-h-100 flex-col items-center justify-center">
      <Spinner size="xl" />
      <p className="mt-4 text-slate-500">{message}</p>
    </div>
  );
}

export function LoadingOverlay({ message = "Loading..." }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-2 text-sm text-slate-500">{message}</p>
      </div>
    </div>
  );
}
