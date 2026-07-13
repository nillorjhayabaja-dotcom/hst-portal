import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/app/StatusBadge";
import { cn } from "@/lib/utils";
import {
  getEmployeeDisplayName,
  getDepartmentName,
} from "@/utils/display";
import { useApprovalRequests } from "@/services/approval-hooks";
import { useNotifications } from "@/services/notification-hooks";

export function RecentRequests({
  title = "Recent Requests",
  filter,
  limit = 5,
}: {
  title?: string;
  filter?: (r: any) => boolean;
  limit?: number;
}) {
  const { data, isLoading } = useApprovalRequests({ pageSize: limit });
  const requests = data?.data || [];
  const rows = filter ? requests.filter(filter) : requests;
  
  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

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
        {rows.map((r: any) => (
          <div
            key={r.id}
            className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{r.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {r.controlNumber} · {getEmployeeDisplayName(r.requester as any)}
              </p>
            </div>
            <StatusBadge status={r.status} />
          </div>
        ))}
        {rows.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">No requests found</p>
        )}
      </CardContent>
    </Card>
  );
}

export function ApprovalQueueCard({ title = "Pending Approvals" }: { title?: string }) {
  const { data, isLoading } = useApprovalRequests({ status: "pending", pageSize: 4 });
  const requests = data?.data || [];
  
  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <span className="rounded-full bg-warning/20 px-2 py-0.5 text-xs font-semibold text-warning-foreground">
          {requests.length} waiting
        </span>
      </CardHeader>
      <CardContent className="space-y-2">
        {requests.map((r: any) => (
          <div
            key={r.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{r.title}</p>
              <p className="text-xs text-muted-foreground">
                {r.moduleId} · {getDepartmentName(r.department as any)}
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
        {requests.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">No pending approvals</p>
        )}
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
  const { data, isLoading } = useNotifications({ pageSize: 5 });
  const notifications = data?.data || [];

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {notifications.map((n: any) => (
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
              <p className="text-[11px] text-muted-foreground/70">
                {new Date(n.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
        {notifications.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">No recent activity</p>
        )}
      </CardContent>
    </Card>
  );
}