// Universal Timeline - Reusable approval timeline with icons and status indicators
import { cn } from "@/lib/utils";
import {
  FileText,
  Search,
  CheckCircle,
  Send,
  Flag,
  XCircle,
  Clock,
  ArrowRight,
} from "lucide-react";

interface TimelineEvent {
  id: string;
  status: string;
  actor: string;
  role: string;
  date: string;
  note?: string;
  icon: string;
  completed: boolean;
  current: boolean;
  rejected: boolean;
}

const ICON_MAP: Record<string, typeof FileText> = {
  FileText,
  Search,
  CheckCircle,
  Send,
  Flag,
  XCircle,
  Clock,
};

interface UniversalTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export function UniversalTimeline({ events, className }: UniversalTimelineProps) {
  return (
    <div className={cn("space-y-0", className)}>
      {events.map((event, index) => {
        const Icon = ICON_MAP[event.icon] ?? Clock;
        const isLast = index === events.length - 1;

        return (
          <div key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
            {/* Vertical line */}
            {!isLast && (
              <div
                className={cn(
                  "absolute left-[15px] top-8 h-full w-0.5",
                  event.completed ? "bg-primary/30" : "bg-border",
                )}
              />
            )}

            {/* Icon circle */}
            <div className="relative z-10 shrink-0">
              <div
                className={cn(
                  "grid size-8 place-items-center rounded-full border-2 transition-colors",
                  event.completed && "border-primary bg-primary/10 text-primary",
                  event.current &&
                    "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25",
                  event.rejected && "border-destructive bg-destructive/10 text-destructive",
                  !event.completed &&
                    !event.current &&
                    !event.rejected &&
                    "border-border bg-muted text-muted-foreground",
                )}
              >
                {event.rejected ? (
                  <XCircle className="size-4" />
                ) : event.completed || event.current ? (
                  <Icon className="size-4" />
                ) : (
                  <Clock className="size-4" />
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    event.completed && "text-foreground",
                    event.current && "text-primary",
                    event.rejected && "text-destructive",
                    !event.completed &&
                      !event.current &&
                      !event.rejected &&
                      "text-muted-foreground",
                  )}
                >
                  {event.status}
                </p>
                {event.current && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary animate-pulse">
                    Current
                  </span>
                )}
                {event.rejected && (
                  <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
                    Rejected
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                {event.actor && (
                  <span className="font-medium text-foreground/80">{event.actor}</span>
                )}
                {event.role && <span>({event.role})</span>}
                {event.date && (
                  <>
                    <span>·</span>
                    <span>{event.date}</span>
                  </>
                )}
              </div>
              {event.note && (
                <p className="mt-1 text-xs text-muted-foreground/80 italic border-l-2 border-border pl-2">
                  {event.note}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
