// Universal KPI Card - Reusable statistics card with trend, loading state, and hover effects
import { ArrowDownRight, ArrowUpRight, type LucideIcon, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface KpiTrend {
  value: string;
  up?: boolean;
  label?: string;
}

interface UniversalKpiCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: KpiTrend;
  subtitle?: string;
  tone?: "primary" | "accent" | "success" | "warning" | "info" | "danger";
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

const TONE_MAP: Record<string, string> = {
  primary: "text-primary bg-primary/10",
  accent: "text-accent bg-accent/10",
  success: "text-success bg-success/10",
  warning: "text-warning-foreground bg-warning/20",
  info: "text-info bg-info/10",
  danger: "text-destructive bg-destructive/10",
};

const TREND_COLORS: Record<string, string> = {
  primary: "text-primary",
  accent: "text-accent",
  success: "text-success",
  warning: "text-warning-foreground",
  info: "text-info",
  danger: "text-destructive",
};

export function UniversalKpiCard({
  label,
  value,
  icon: Icon,
  trend,
  subtitle,
  tone = "primary",
  loading = false,
  onClick,
  className,
}: UniversalKpiCardProps) {
  if (loading) {
    return (
      <Card className={cn("relative overflow-hidden p-5", onClick && "cursor-pointer", className)}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="size-11 shrink-0 rounded-xl" />
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "relative overflow-hidden p-5 shadow-card transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-elegant hover:-translate-y-0.5",
        className,
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={cn("grid size-11 shrink-0 place-items-center rounded-xl", TONE_MAP[tone])}>
            <Icon className="size-5" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-semibold",
              trend.up ? "text-success" : "text-destructive",
            )}
          >
            {trend.up ? (
              <ArrowUpRight className="size-3.5" />
            ) : (
              <ArrowDownRight className="size-3.5" />
            )}
            {trend.value}
          </span>
          {trend.label && <span className="text-muted-foreground">{trend.label}</span>}
        </div>
      )}
      {/* Subtle gradient overlay */}
      <div
        className={cn(
          "pointer-events-none absolute -right-6 -top-6 size-24 rounded-full opacity-5",
          TONE_MAP[tone],
        )}
      />
    </Card>
  );
}