import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/app/StatusBadge";
import { REQUESTS, NOTIFICATIONS } from "@/mock/data";
import { cn } from "@/lib/utils";

export function RecentRequests({
  title = "Recent Requests",
  filter,
  limit = 5,
}: {
  title?: string;
  filter?: (r: (typeof REQUESTS)[number]) => boolean;
  limit?: number;
}) {
  const rows = (filter ? REQUESTS.filter(filter) : REQUESTS).slice(0, limit);
  return (
    <Card className="shadow-card">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/app/m/$moduleId" params={{ moduleId: "approvals" }}>
            View all
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-1">
        {rows.map((r) => (
          <div
            key={r.id}
            className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{r.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {r.controlNumber} · {r.requester}
              </p>
            </div>
            <StatusBadge status={r.status} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function ApprovalQueueCard({ title = "Pending Approvals" }: { title?: string }) {
  const rows = REQUESTS.filter((r) => ["Pending", "In Review"].includes(r.status)).slice(0, 4);
  return (
    <Card className="shadow-card">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <span className="rounded-full bg-warning/20 px-2 py-0.5 text-xs font-semibold text-warning-foreground">
          {rows.length} waiting
        </span>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{r.title}</p>
              <p className="text-xs text-muted-foreground">
                {r.type} · {r.department}
              </p>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                Review
              </Button>
              <Button size="sm" className="h-7 px-2 text-xs">
                Approve
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function QuickActions({
  actions,
}: {
  actions: { label: string; icon: LucideIcon; to: string; tone?: string }[];
}) {
  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2.5">
        {actions.map((a) => (
          <Link
            key={a.label}
            to={a.to}
            className="flex flex-col items-start gap-2 rounded-xl border border-border p-3.5 transition-all hover:border-primary/40 hover:shadow-card"
          >
            <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <a.icon className="size-4.5 size-[18px]" />
            </span>
            <span className="text-sm font-medium text-foreground">{a.label}</span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

export function ActivityFeed({ title = "Recent Activity" }: { title?: string }) {
  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {NOTIFICATIONS.map((n) => (
          <div key={n.id} className="flex gap-3">
            <span
              className={cn(
                "mt-1 size-2 shrink-0 rounded-full",
                n.type === "alert" && "bg-destructive",
                n.type === "approval" && "bg-warning",
                n.type === "system" && "bg-info",
                n.type === "info" && "bg-primary",
              )}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{n.title}</p>
              <p className="truncate text-xs text-muted-foreground">{n.message}</p>
              <p className="text-[11px] text-muted-foreground/70">{n.time}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
