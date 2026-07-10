import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bell, Check, AlertTriangle, Info, Settings2, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NOTIFICATIONS } from "@/mock/data";
import type { NotificationItem } from "@/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/notifications")({
  component: NotificationsPage,
});

const ICON = {
  approval: Check,
  system: Settings2,
  alert: AlertTriangle,
  info: Info,
};

const TONE = {
  approval: "bg-warning/15 text-warning-foreground",
  system: "bg-info/12 text-info",
  alert: "bg-destructive/12 text-destructive",
  info: "bg-primary/12 text-primary",
};

function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>(NOTIFICATIONS);
  const [tab, setTab] = useState("all");

  const filtered = tab === "unread" ? items.filter((n) => !n.read) : items;
  const markAll = () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("All notifications marked as read");
  };
  const markOne = (id: string) =>
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

  return (
    <>
      <PageHeader
        title="Notifications"
        description="System alerts, approvals and activity updates"
        crumbs={[{ label: "Home", to: "/app/dashboard" }, { label: "Notifications" }]}
        actions={
          <Button variant="outline" size="sm" onClick={markAll} className="gap-1.5">
            <CheckCheck className="size-4" /> Mark all read
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread ({items.filter((n) => !n.read).length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="You're all caught up"
          description="No notifications to show."
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((n) => {
            const Icon = ICON[n.type];
            return (
              <Card
                key={n.id}
                className={cn(
                  "flex items-start gap-4 p-4 shadow-card transition-colors",
                  !n.read && "border-primary/30 bg-primary/[0.03]",
                )}
              >
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-xl",
                    TONE[n.type],
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{n.title}</p>
                    {!n.read && <span className="size-2 rounded-full bg-primary" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground/70">{n.time}</p>
                </div>
                {!n.read && (
                  <Button variant="ghost" size="sm" onClick={() => markOne(n.id)}>
                    Mark read
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
