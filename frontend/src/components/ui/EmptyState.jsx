import { cn } from "../../utils/helpers";
import { Inbox, SearchX, FileX, AlertCircle } from "lucide-react";
import Button from "./Button";

const icons = {
  empty: Inbox,
  search: SearchX,
  file: FileX,
  error: AlertCircle,
};

export default function EmptyState({
  icon = "empty",
  title = "No data found",
  description,
  action,
  actionLabel = "Take action",
  className,
}) {
  const Icon = icons[icon] || icons.empty;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className,
      )}
    >
      <div className="mb-4 rounded-full bg-brand-50 p-4">
        <Icon className="h-8 w-8 text-brand-400" />
      </div>
      <h3 className="font-display text-lg font-medium text-slate-900">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      )}
      {action && (
        <Button onClick={action} className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
