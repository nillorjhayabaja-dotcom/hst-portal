// Notification Rules Manager - ERP Configuration
import { useState } from "react";
import { EnterpriseDataTable, type Column } from "@/components/enterprise/EnterpriseDataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, BellRing } from "lucide-react";
import {
  getNotificationRules,
  createNotificationRule,
  deleteNotificationRule,
} from "@/services/config-engine";
import type { NotificationRule } from "@/types/configuration";
import type { ModuleId, RoleId } from "@/types";
import { cn } from "@/lib/utils";

const EVENTS = ["submitted", "approved", "rejected", "returned", "escalated", "reminder"];

export function NotificationRulesManager() {
  const [rules, setRules] = useState<NotificationRule[]>(getNotificationRules());
  const [showCreate, setShowCreate] = useState(false);

  const refresh = () => setRules(getNotificationRules());

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const roles = ((formData.get("notifyRoles") as string) || "")
      .split(",")
      .filter(Boolean) as RoleId[];
    const channels = [];
    if (formData.get("channel_inapp") === "true") channels.push("in_app");
    if (formData.get("channel_email") === "true") channels.push("email");
    if (formData.get("channel_sms") === "true") channels.push("sms");

    createNotificationRule({
      moduleId: formData.get("moduleId") as ModuleId,
      event: formData.get("event") as string,
      notifyRoles: roles.length > 0 ? roles : [],
      notifyUsers: [],
      channels: channels.length > 0 ? (channels as ("in_app" | "email" | "sms")[]) : ["in_app"],
      templateSubject: formData.get("templateSubject") as string,
      templateBody: formData.get("templateBody") as string,
      active: true,
    });
    refresh();
    setShowCreate(false);
    form.reset();
  };

  const handleDelete = (id: string) => {
    deleteNotificationRule(id);
    refresh();
  };

  const channelBadges: Record<string, string> = {
    in_app: "bg-primary/10 text-primary",
    email: "bg-info/10 text-info",
    sms: "bg-success/10 text-success",
  };

  const columns: Column<NotificationRule>[] = [
    {
      id: "moduleId",
      header: "Module",
      accessorKey: "moduleId",
      sortable: true,
      width: "140px",
      cell: (val) => (
        <span className="capitalize font-medium">{String(val).replace("-", " ")}</span>
      ),
    },
    {
      id: "event",
      header: "Event",
      accessorKey: "event",
      sortable: true,
      width: "120px",
      cell: (val) => (
        <Badge variant="secondary" className="text-xs capitalize">
          {String(val).replace(/_/g, " ")}
        </Badge>
      ),
    },
    { id: "templateSubject", header: "Subject", accessorKey: "templateSubject", filterable: true },
    {
      id: "channels",
      header: "Channels",
      accessorKey: "channels",
      width: "160px",
      cell: (val) => (
        <div className="flex gap-1">
          {(val as string[]).map((ch) => (
            <Badge key={ch} variant="secondary" className={cn("text-[10px]", channelBadges[ch])}>
              {ch.replace("_", " ")}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      id: "active",
      header: "Active",
      accessorKey: "active",
      width: "80px",
      cell: (val) =>
        val ? (
          <Badge className="text-xs bg-success/10 text-success">On</Badge>
        ) : (
          <Badge variant="secondary" className="text-xs">
            Off
          </Badge>
        ),
    },
    {
      id: "actions",
      header: "",
      accessorKey: "id",
      width: "60px",
      cell: (_, row) => (
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(row.id);
          }}
        >
          <Trash2 className="size-3.5" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Notification Rules</h3>
          <p className="text-sm text-muted-foreground">
            Configure which notifications are sent per module and event
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" />
              New Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Notification Rule</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Module</Label>
                  <Select name="moduleId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select module" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gate-pass">Gate Pass</SelectItem>
                      <SelectItem value="leave">Leave</SelectItem>
                      <SelectItem value="mrf">MRF</SelectItem>
                      <SelectItem value="purchase-request">Purchase Request</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Event</Label>
                  <Select name="event" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select event" />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENTS.map((ev) => (
                        <SelectItem key={ev} value={ev}>
                          {ev.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Notify Roles (comma-separated)</Label>
                <Input name="notifyRoles" placeholder="e.g., supervisor, manager" />
              </div>
              <div className="space-y-2">
                <Label>Channels</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="channel_inapp"
                      value="true"
                      defaultChecked
                      className="rounded border-border"
                    />
                    In-App
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="channel_email"
                      value="true"
                      className="rounded border-border"
                    />
                    Email
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="channel_sms"
                      value="true"
                      className="rounded border-border"
                    />
                    SMS
                  </label>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Subject Template</Label>
                <Input
                  name="templateSubject"
                  placeholder="e.g., New Gate Pass {{control_number}}"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Body Template</Label>
                <Textarea
                  name="templateBody"
                  placeholder="Use {{variables}} like {{requester}}, {{title}}, {{control_number}}"
                  required
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Rule</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          <EnterpriseDataTable
            data={rules}
            columns={columns}
            keyExtractor={(row) => row.id}
            searchable
            searchPlaceholder="Search notification rules..."
            exportable
            filename="notification-rules"
            emptyState={
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <BellRing className="size-12 text-muted-foreground/30" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">No notification rules</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Create rules to control how users are notified
                  </p>
                </div>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
