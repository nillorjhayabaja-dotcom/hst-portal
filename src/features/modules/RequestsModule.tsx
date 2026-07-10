import { useMemo, useState } from "react";
import { Plus, Eye, Check, X } from "lucide-react";
import { toast } from "sonner";
import type { ModuleId, RequestItem, RequestType, RoleId } from "@/types";
import { REQUESTS } from "@/mock/data";
import { canApprove, canCreate } from "@/rbac/permissions";
import { DataTable, type Column } from "@/components/app/DataTable";
import { StatusBadge } from "@/components/app/StatusBadge";
import { ApprovalStepper } from "@/components/app/ApprovalStepper";
import { StatCard } from "@/components/app/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ClipboardList, FileClock, CheckCircle2, XCircle } from "lucide-react";

const TYPE_MAP: Partial<Record<ModuleId, RequestType>> = {
  "gate-pass": "Gate Pass",
  leave: "Leave",
  mrf: "MRF",
  "purchase-request": "Purchase Request",
};

export function RequestsModule({
  module,
  role,
  label,
}: {
  module: ModuleId;
  role: RoleId;
  label: string;
}) {
  const type = TYPE_MAP[module];
  const isApprovals = module === "approvals";
  const [rows, setRows] = useState<RequestItem[]>(REQUESTS);
  const [selected, setSelected] = useState<RequestItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const data = useMemo(() => {
    if (isApprovals) return rows.filter((r) => ["Pending", "In Review"].includes(r.status));
    return rows.filter((r) => r.type === type);
  }, [rows, type, isApprovals]);

  const stats = useMemo(
    () => ({
      total: data.length,
      pending: data.filter((r) => ["Pending", "In Review"].includes(r.status)).length,
      approved: data.filter((r) => ["Approved", "Completed"].includes(r.status)).length,
      rejected: data.filter((r) => ["Rejected", "Returned"].includes(r.status)).length,
    }),
    [data],
  );

  const decide = (r: RequestItem, approve: boolean) => {
    setRows((prev) =>
      prev.map((x) => (x.id === r.id ? { ...x, status: approve ? "Approved" : "Rejected" } : x)),
    );
    setSelected(null);
    toast[approve ? "success" : "error"](
      `${r.controlNumber} ${approve ? "approved" : "rejected"}`,
      { description: approve ? "Routed to next approver." : "Returned to requester." },
    );
  };

  const submitNew = () => {
    setCreateOpen(false);
    toast.success(`${label} submitted`, {
      description: "A control number was generated and routed for approval.",
    });
  };

  const columns: Column<RequestItem>[] = [
    {
      key: "controlNumber",
      header: "Control No.",
      render: (r) => <span className="font-mono text-xs font-medium">{r.controlNumber}</span>,
    },
    {
      key: "title",
      header: "Title",
      render: (r) => <span className="font-medium">{r.title}</span>,
    },
    ...(isApprovals ? [{ key: "type", header: "Type" } as Column<RequestItem>] : []),
    { key: "requester", header: "Requester" },
    { key: "priority", header: "Priority", render: (r) => <StatusBadge status={r.priority} /> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (r) => (
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setSelected(r)}>
          <Eye className="size-4" /> View
        </Button>
      ),
    },
  ];

  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total" value={stats.total} icon={ClipboardList} tone="primary" />
        <StatCard label="Pending" value={stats.pending} icon={FileClock} tone="warning" />
        <StatCard label="Approved" value={stats.approved} icon={CheckCircle2} tone="success" />
        <StatCard label="Rejected" value={stats.rejected} icon={XCircle} tone="info" />
      </div>

      <DataTable
        columns={columns}
        data={data}
        searchKeys={["controlNumber", "title", "requester", "department"]}
        searchPlaceholder={`Search ${label.toLowerCase()}…`}
        onRowClick={(r) => setSelected(r)}
        emptyTitle={`No ${label.toLowerCase()} found`}
        toolbar={
          canCreate(role, module) && type ? (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-1.5">
                  <Plus className="size-4" /> New {label}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create {label}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label>Title / Purpose</Label>
                    <Input placeholder={`Describe your ${label.toLowerCase()}…`} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Priority</Label>
                      <Input placeholder="Normal" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Date needed</Label>
                      <Input type="date" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Details</Label>
                    <Textarea placeholder="Additional information…" rows={3} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={submitNew}>Submit request</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : undefined
        }
      />

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto scrollbar-thin sm:max-w-lg">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.title}</SheetTitle>
                <SheetDescription className="font-mono text-xs">
                  {selected.controlNumber} · {selected.type}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-6 px-4 pb-6">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Field label="Requester" value={selected.requester} />
                  <Field label="Department" value={selected.department} />
                  <Field label="Priority" value={selected.priority} />
                  <Field label="Created" value={selected.createdAt} />
                  {selected.amount && <Field label="Amount" value={selected.amount} />}
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <StatusBadge status={selected.status} className="mt-1" />
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-sm font-semibold text-foreground">Approval Flow</p>
                  <ApprovalStepper steps={selected.steps} />
                </div>

                {canApprove(role, module) && ["Pending", "In Review"].includes(selected.status) && (
                  <div className="flex gap-2 border-t border-border pt-4">
                    <Button
                      variant="outline"
                      className="flex-1 gap-1.5 text-destructive hover:text-destructive"
                      onClick={() => decide(selected, false)}
                    >
                      <X className="size-4" /> Reject
                    </Button>
                    <Button className="flex-1 gap-1.5" onClick={() => decide(selected, true)}>
                      <Check className="size-4" /> Approve
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-medium text-foreground">{value}</p>
    </div>
  );
}
