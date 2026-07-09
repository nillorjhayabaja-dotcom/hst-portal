import { Check, X } from "lucide-react";
import type { ApprovalStep } from "@/types";
import { cn } from "@/lib/utils";

export function ApprovalStepper({ steps }: { steps: ApprovalStep[] }) {
  return (
    <ol className="relative space-y-0">
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        return (
          <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
            {!last && (
              <span
                className={cn(
                  "absolute left-[15px] top-8 h-[calc(100%-16px)] w-0.5",
                  s.status === "done" ? "bg-success" : "bg-border",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 grid size-8 shrink-0 place-items-center rounded-full ring-4 ring-background text-xs font-semibold",
                s.status === "done" && "bg-success text-success-foreground",
                s.status === "current" && "bg-primary text-primary-foreground animate-pulse",
                s.status === "pending" && "bg-muted text-muted-foreground",
                s.status === "rejected" && "bg-destructive text-destructive-foreground",
              )}
            >
              {s.status === "done" ? (
                <Check className="size-4" />
              ) : s.status === "rejected" ? (
                <X className="size-4" />
              ) : (
                i + 1
              )}
            </span>
            <div className="min-w-0 pt-1">
              <p className="text-sm font-semibold text-foreground">{s.role}</p>
              <p className="text-xs text-muted-foreground">
                {s.actor ? s.actor : "Awaiting action"}
                {s.date ? ` • ${s.date}` : ""}
              </p>
              {s.note && <p className="mt-1 text-xs italic text-muted-foreground">"{s.note}"</p>}
            </div>
            <span className="ml-auto self-start pt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {s.status}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
