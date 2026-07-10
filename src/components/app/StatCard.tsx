import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: string; up?: boolean };
  hint?: string;
  tone?: "primary" | "accent" | "success" | "warning" | "info";
}

const TONE: Record<string, string> = {
  primary: "text-primary bg-primary/10",
  accent: "text-accent bg-accent/10",
  success: "text-success bg-success/10",
  warning: "text-warning-foreground bg-warning/20",
  info: "text-info bg-info/10",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  hint,
  tone = "primary",
}: StatCardProps) {
  return (
    <Card className="relative overflow-hidden p-5 shadow-card transition-shadow hover:shadow-elegant">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground">
            {value}
          </p>
        </div>
        <div className={cn("grid size-11 shrink-0 place-items-center rounded-xl", TONE[tone])}>
          <Icon className="size-5" />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs">
        {trend && (
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
        )}
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
    </Card>
  );
}
