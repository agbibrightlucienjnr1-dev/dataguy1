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
      <div className="mb-4 rounded-full bg-gray-100 p-4">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>
      )}
      {action && (
        <Button onClick={action} className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
