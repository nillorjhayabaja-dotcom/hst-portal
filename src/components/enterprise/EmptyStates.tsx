// Empty States - Reusable illustrations for empty data scenarios
import { type LucideIcon, Inbox, Search, Bell, Paperclip, FileText, ClipboardList, Users, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP = {
  sm: { icon: "size-8", title: "text-sm", desc: "text-xs", gap: "gap-2", py: "py-8" },
  md: { icon: "size-12", title: "text-base", desc: "text-sm", gap: "gap-3", py: "py-12" },
  lg: { icon: "size-16", title: "text-lg", desc: "text-sm", gap: "gap-4", py: "py-16" },
};

function EmptyStateBase({ icon: Icon, title, description, action, className, size = "md" }: EmptyStateProps) {
  const s = SIZE_MAP[size];
  return (
    <div className={cn("flex flex-col items-center justify-center text-center", s.gap, s.py, className)}>
      {Icon && (
        <div className="grid place-items-center rounded-full bg-muted/50 p-4">
          <Icon className={cn(s.icon, "text-muted-foreground/30")} />
        </div>
      )}
      <div className="space-y-1">
        <p className={cn("font-semibold text-muted-foreground", s.title)}>{title}</p>
        <p className={cn("text-muted-foreground/60 max-w-xs", s.desc)}>{description}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// Pre-configured empty states
export function NoRequests({ action, size = "md" }: { action?: React.ReactNode; size?: "sm" | "md" | "lg" }) {
  return (
    <EmptyStateBase
      icon={Inbox}
      title="No requests found"
      description="There are no requests matching your criteria. Create a new request to get started."
      action={action}
      size={size}
    />
  );
}

export function NoNotifications({ action, size = "md" }: { action?: React.ReactNode; size?: "sm" | "md" | "lg" }) {
  return (
    <EmptyStateBase
      icon={Bell}
      title="All caught up!"
      description="You have no unread notifications. We'll notify you when something needs your attention."
      action={action}
      size={size}
    />
  );
}

export function NoSearchResults({ query, size = "md" }: { query?: string; size?: "sm" | "md" | "lg" }) {
  return (
    <EmptyStateBase
      icon={Search}
      title={query ? `No results for "${query}"` : "No results found"}
      description="Try adjusting your search terms or filters to find what you're looking for."
      size={size}
    />
  );
}

export function NoAttachments({ action, size = "md" }: { action?: React.ReactNode; size?: "sm" | "md" | "lg" }) {
  return (
    <EmptyStateBase
      icon={Paperclip}
      title="No attachments"
      description="No files have been attached yet. Upload documents to support this request."
      action={action}
      size={size}
    />
  );
}

export function NoData({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  return (
    <EmptyStateBase
      icon={ClipboardList}
      title="No data available"
      description="There is no data to display for this section."
      size={size}
    />
  );
}

export function NoEmployees({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  return (
    <EmptyStateBase
      icon={Users}
      title="No employees found"
      description="No employees match your current search or filter criteria."
      size={size}
    />
  );
}

export function NoAssets({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  return (
    <EmptyStateBase
      icon={Package}
      title="No assets found"
      description="There are no assets registered in the system matching your criteria."
      size={size}
    />
  );
}