// Quick Action Cards - Reusable shortcuts for creating, viewing, reports, approval, settings
import { useNavigate } from "@tanstack/react-router";
import {
  DoorOpen,
  CalendarCheck,
  Users,
  ShoppingCart,
  BarChart3,
  CheckCircle,
  Settings,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { QuickAction } from "@/types/enterprise";
import { MOCK_QUICK_ACTIONS } from "@/mock/enterprise-data";

const ICON_MAP: Record<string, LucideIcon> = {
  DoorOpen,
  CalendarCheck,
  Users,
  ShoppingCart,
  BarChart3,
  CheckCircle,
  Settings,
  Plus,
};

const COLOR_MAP: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:border-blue-500/40",
  green: "bg-success/10 text-success border-success/20 hover:border-success/40",
  purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 hover:border-purple-500/40",
  orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 hover:border-orange-500/40",
  red: "bg-destructive/10 text-destructive border-destructive/20 hover:border-destructive/40",
  teal: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20 hover:border-teal-500/40",
};

interface QuickActionCardsProps {
  actions?: QuickAction[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function QuickActionCards({
  actions = MOCK_QUICK_ACTIONS,
  columns = 3,
  className,
}: QuickActionCardsProps) {
  const navigate = useNavigate();

  const handleAction = (action: QuickAction) => {
    // In a real app, this would navigate or open a modal
    if (action.to) {
      navigate({ to: action.to });
    }
  };

  const getIcon = (iconName: string) => {
    const Icon = ICON_MAP[iconName] ?? Plus;
    return <Icon className="size-5" />;
  };

  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-3", gridCols[columns], className)}>
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => handleAction(action)}
          className={cn(
            "group flex items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
            COLOR_MAP[action.color] ?? "bg-muted/50 hover:bg-muted",
          )}
        >
          <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-background/80 dark:bg-background/50">
            {getIcon(action.icon)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{action.label}</p>
            <p className="text-xs text-muted-foreground/80 mt-0.5">{action.description}</p>
          </div>
        </button>
      ))}
    </div>
  );
}