// Notification Center - Enterprise Notification Drawer
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  CheckCheck,
  ChevronRight,
  AlertCircle,
  Info,
  Megaphone,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from "@/services/notification-hooks";
import { useAuth } from "@/contexts/AuthContext";

export function NotificationCenter() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data, isLoading } = useNotifications({ pageSize: 50 });
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();

  const notifications = data?.data || [];
  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    if (user?.id) {
      markAllAsRead.mutate(user.id, {
        onSuccess: () => toast.success("All notifications marked as read"),
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "approval":
        return <Bell className="size-4 text-blue-500" />;
      case "alert":
        return <AlertCircle className="size-4 text-destructive" />;
      case "system":
        return <Info className="size-4 text-info" />;
      case "info":
        return <Info className="size-4 text-muted-foreground" />;
      default:
        return <Bell className="size-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      approval: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      alert: "bg-destructive/10 text-destructive",
      system: "bg-info/10 text-info",
      info: "bg-muted text-muted-foreground",
    };
    return (
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-[10px] font-medium",
          styles[type] ?? styles.info,
        )}
      >
        {type}
      </span>
    );
  };

  const renderNotification = (n: any) => (
    <button
      key={n.id}
      onClick={() => handleMarkAsRead(n.id)}
      className={cn(
        "flex w-full items-start gap-3 px-6 py-4 text-left transition-colors hover:bg-muted/50",
        !n.isRead && "bg-primary/5",
      )}
    >
      <div className="mt-0.5 shrink-0">{getTypeIcon(n.type)}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "text-sm truncate",
              !n.isRead ? "font-semibold text-foreground" : "text-muted-foreground",
            )}
          >
            {n.title}
          </p>
          {!n.isRead && (
            <span className="size-1.5 shrink-0 rounded-full bg-primary" />
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
          {n.message}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground/60">
            {new Date(n.createdAt).toLocaleDateString()}
          </span>
          {getTypeBadge(n.type)}
          {n.priority && n.priority !== "Normal" && (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                n.priority === "High" || n.priority === "Urgent"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {n.priority}
            </span>
          )}
        </div>
      </div>
      <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground/40" />
    </button>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground animate-in zoom-in">
              {unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-0">
        <SheetHeader className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <Bell className="size-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {unreadCount} new
                </Badge>
              )}
            </SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={handleMarkAllAsRead}
              >
                <CheckCheck className="size-3.5" />
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>

        <Tabs defaultValue="all" className="flex flex-col h-[calc(100vh-73px)]">
          <div className="border-b border-border px-6">
            <TabsList className="h-10 w-full justify-start gap-4 bg-transparent p-0">
              <TabsTrigger value="all" className="text-xs data-[state=active]:shadow-none">
                All
              </TabsTrigger>
              <TabsTrigger value="approval" className="text-xs data-[state=active]:shadow-none">
                Approvals
              </TabsTrigger>
              <TabsTrigger value="system" className="text-xs data-[state=active]:shadow-none">
                System
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="flex-1 p-0 m-0">
            <ScrollArea className="h-full">
              <div className="divide-y divide-border">
                {isLoading ? (
                  <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
                    Loading...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-16 text-center">
                    <Bell className="size-10 text-muted-foreground/30" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">No notifications</p>
                      <p className="text-xs text-muted-foreground/60">You're all caught up!</p>
                    </div>
                  </div>
                ) : (
                  notifications.map(renderNotification)
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="approval" className="flex-1 p-0 m-0">
            <ScrollArea className="h-full">
              <div className="divide-y divide-border">
                {notifications
                  .filter((n: any) => n.type === "approval")
                  .map(renderNotification)}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="system" className="flex-1 p-0 m-0">
            <ScrollArea className="h-full">
              <div className="divide-y divide-border">
                {notifications
                  .filter((n: any) => n.type === "system" || n.type === "alert" || n.type === "info")
                  .map(renderNotification)}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="border-t border-border px-6 py-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full gap-2 text-xs"
            onClick={() => {
              setOpen(false);
              navigate({ to: "/app/notifications" });
            }}
          >
            <ExternalLink className="size-3.5" />
            View all notifications
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}