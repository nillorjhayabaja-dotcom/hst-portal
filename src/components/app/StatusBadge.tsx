import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "primary";

const TONE_MAP: Record<string, Tone> = {
  Approved: "success",
  Completed: "success",
  Active: "success",
  "Checked In": "success",
  Available: "success",
  "In Use": "info",
  "In Review": "info",
  Scheduled: "info",
  Pending: "warning",
  "On Leave": "warning",
  Maintenance: "warning",
  Draft: "neutral",
  Inactive: "neutral",
  "Checked Out": "neutral",
  Assigned: "primary",
  Rejected: "danger",
  Returned: "danger",
  Urgent: "danger",
  High: "warning",
  Normal: "info",
  Low: "neutral",
};

const TONE_CLASSES: Record<Tone, string> = {
  success: "bg-success/12 text-success ring-1 ring-success/25",
  warning: "bg-warning/15 text-warning-foreground ring-1 ring-warning/40",
  danger: "bg-destructive/12 text-destructive ring-1 ring-destructive/25",
  info: "bg-info/12 text-info ring-1 ring-info/25",
  neutral: "bg-muted text-muted-foreground ring-1 ring-border",
  primary: "bg-primary/12 text-primary ring-1 ring-primary/25",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const tone = TONE_MAP[status] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        TONE_CLASSES[tone],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-80" />
      {status}
    </span>
  );
}
