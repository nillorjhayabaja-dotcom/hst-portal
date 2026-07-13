import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bell, Check, AlertTriangle, Info, Settings2, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from "@/services/notification-hooks";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/app/notifications")({
  component: NotificationsPage,
});

const ICON: Record<string, any> = {
  approval: Check,
  system: Settings2,
  alert: AlertTriangle,
  info: Info,
};

const TONE: Record<string, string> = {
  approval: "bg-warning/15 text-warning-foreground",
  system: "bg-info/12 text-info",
  alert: "bg-destructive/12 text-destructive",
  info: "bg-primary/12 text-primary",
};

function NotificationsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("all");
  const { data, isLoading } = useNotifications({ 
    isRead: tab === "unread" ? false : undefined 
  });
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();

  const items = data?.data || [];
  const unreadCount = items.filter((n: any) => !n.isRead).length;

  const handleMarkAll = () => {
    if (user?.id) {
      markAllAsRead.mutate(user.id, {
        onSuccess: () => toast.success("All notifications marked as read"),
      });
    }
  };

  const handleMarkOne = (id: string) => {
    markAsRead.mutate(id);
  };

  return (
    <>
      <PageHeader
        title="Notifications"
        description="System alerts, approvals and activity updates"
        crumbs={[{ label: "Home", to: "/app/dashboard" }, { label: "Notifications" }]}
        actions={
          <Button variant="outline" size="sm" onClick={handleMarkAll} className="gap-1.5" disabled={unreadCount === 0}>
            <CheckCheck className="size-4" /> Mark all read
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          Loading notifications...
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="You're all caught up"
          description="No notifications to show."
        />
      ) : (
        <div className="space-y-2.5">
          {items.map((n: any) => {
            const Icon = ICON[n.type] || Info;
            return (
              <Card
                key={n.id}
                className={cn(
                  "flex items-start gap-4 p-4 shadow-card transition-colors",
                  !n.isRead && "border-primary/30 bg-primary/[0.03]",
                )}
              >
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-xl",
                    TONE[n.type] || TONE.info,
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{n.title}</p>
                    {!n.isRead && <span className="size-2 rounded-full bg-primary" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {!n.isRead && (
                  <Button variant="ghost" size="sm" onClick={() => handleMarkOne(n.id)}>
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