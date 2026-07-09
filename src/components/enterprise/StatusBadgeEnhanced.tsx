// Enhanced Status Badge - Standardized badges for all enterprise statuses
import { cn } from "@/lib/utils";
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Send,
  Flag,
  Ban,
  Undo2,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";

type StatusTone = "success" | "warning" | "danger" | "info" | "neutral" | "primary" | "purple";

const STATUS_CONFIG: Record<string, { tone: StatusTone; icon: LucideIcon }> = {
  // Request statuses
  Draft: { tone: "neutral", icon: Clock },
  Pending: { tone: "warning", icon: Clock },
  "In Review": { tone: "info", icon: AlertTriangle },
  Approved: { tone: "success", icon: CheckCircle },
  Rejected: { tone: "danger", icon: XCircle },
  Released: { tone: "primary", icon: Send },
  Completed: { tone: "success", icon: Flag },
  Cancelled: { tone: "neutral", icon: Ban },
  Expired: { tone: "neutral", icon: Ban },
  Returned: { tone: "warning", icon: Undo2 },

  // Employee statuses
  Active: { tone: "success", icon: CheckCircle },
  "On Leave": { tone: "warning", icon: Clock },
  Inactive: { tone: "neutral", icon: Ban },

  // Asset/Vehicle statuses
  Assigned: { tone: "primary", icon: CheckCircle },
  Available: { tone: "success", icon: CheckCircle },
  "In Use": { tone: "info", icon: Clock },
  Maintenance: { tone: "warning", icon: AlertTriangle },

  // Visitor statuses
  "Checked In": { tone: "success", icon: CheckCircle },
  Scheduled: { tone: "info", icon: Clock },
  "Checked Out": { tone: "neutral", icon: Send },

  // Priority levels
  Low: { tone: "neutral", icon: Clock },
  Normal: { tone: "info", icon: Clock },
  High: { tone: "warning", icon: AlertTriangle },
  Urgent: { tone: "danger", icon: AlertTriangle },

  // Approval step statuses
  done: { tone: "success", icon: CheckCircle },
  current: { tone: "primary", icon: Clock },
  pending: { tone: "neutral", icon: Clock },
  rejected: { tone: "danger", icon: XCircle },
};

const TONE_CLASSES: Record<StatusTone, string> = {
  success: "bg-success/12 text-success ring-1 ring-success/25",
  warning: "bg-warning/15 text-warning-foreground ring-1 ring-warning/40",
  danger: "bg-destructive/12 text-destructive ring-1 ring-destructive/25",
  info: "bg-info/12 text-info ring-1 ring-info/25",
  neutral: "bg-muted text-muted-foreground ring-1 ring-border",
  primary: "bg-primary/12 text-primary ring-1 ring-primary/25",
  purple: "bg-purple-500/12 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/25",
};

interface StatusBadgeEnhancedProps {
  status: string;
  showIcon?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function StatusBadgeEnhanced({
  status,
  showIcon = true,
  size = "sm",
  className,
}: StatusBadgeEnhancedProps) {
  const config = STATUS_CONFIG[status];
  const tone = config?.tone ?? "neutral";
  const Icon = config?.icon ?? Clock;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap",
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {showIcon && <Icon className={cn("shrink-0", size === "sm" ? "size-3" : "size-3.5")} />}
      {status}
    </span>
  );
}

// Dot-only version for compact use (e.g., in tables)
export function StatusDot({ status, className }: { status: string; className?: string }) {
  const config = STATUS_CONFIG[status];
  const tone = config?.tone ?? "neutral";
  const TONE_CLASSES_DOT: Record<StatusTone, string> = {
    success: "bg-success",
    warning: "bg-warning-foreground",
    danger: "bg-destructive",
    info: "bg-info",
    neutral: "bg-muted-foreground",
    primary: "bg-primary",
    purple: "bg-purple-500",
  };

  return <span className={cn("inline-block size-2 rounded-full", TONE_CLASSES_DOT[tone], className)} />;
}