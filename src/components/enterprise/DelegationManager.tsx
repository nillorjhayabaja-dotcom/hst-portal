// Delegation Manager - Configure approval delegations
import { useState, useEffect } from "react";
import { EnterpriseDataTable, type Column } from "@/components/enterprise/EnterpriseDataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { toast } from "sonner";
import { Plus, UserCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getDelegations, createDelegation } from "@/services/approval-engine";
import type { DelegationRule } from "@/types/approval";
import type { ModuleId } from "@/types";

export function DelegationManager() {
  const { user } = useAuth();
  const [delegations, setDelegations] = useState<DelegationRule[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getDelegations().then((delegations) => setDelegations(delegations as DelegationRule[])).catch(() => setDelegations([]));
  }, []);

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    createDelegation({
      delegatorId: user?.id || "",
      delegatorName: user?.name || "",
      delegateId: formData.get("delegateId") as string,
      delegateName: formData.get("delegateName") as string,
      moduleId: (formData.get("moduleId") as ModuleId | null) || undefined,
      startDate: formData.get("startDate") as string,
      endDate: formData.get("endDate") as string,
      active: true,
      reason: formData.get("reason") as string,
    });

    createDelegation({
      delegatorId: user?.id || "",
      delegatorName: user?.name || "",
      delegateId: formData.get("delegateId") as string,
      delegateName: formData.get("delegateName") as string,
      moduleId: (formData.get("moduleId") as ModuleId | null) || undefined,
      startDate: formData.get("startDate") as string,
      endDate: formData.get("endDate") as string,
      active: true,
      reason: formData.get("reason") as string,
    });
    getDelegations().then((delegations) => setDelegations(delegations as DelegationRule[])).catch(() => setDelegations([]));
    setOpen(false);
    form.reset();
  };

  const columns: Column<DelegationRule>[] = [
    { id: "delegatorName", header: "Delegator", accessorKey: "delegatorName", sortable: true },
    { id: "delegateName", header: "Delegate", accessorKey: "delegateName", sortable: true },
    {
      id: "moduleId",
      header: "Module",
      accessorKey: "moduleId",
      sortable: true,
      width: "160px",
      cell: (val) =>
        val ? (
          <span className="capitalize">{String(val).replace("-", " ")}</span>
        ) : (
          <span className="text-muted-foreground">All modules</span>
        ),
    },
    {
      id: "startDate",
      header: "Start Date",
      accessorKey: "startDate",
      sortable: true,
      width: "120px",
    },
    { id: "endDate", header: "End Date", accessorKey: "endDate", sortable: true, width: "120px" },
    { id: "reason", header: "Reason", accessorKey: "reason" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Delegation Rules</h3>
          <p className="text-sm text-muted-foreground">
            Temporarily transfer approval authority to another user
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" />
              New Delegation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Delegation Rule</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Delegate To</Label>
                <Input name="delegateName" placeholder="Enter delegate name" required />
              </div>
              <div className="space-y-1.5">
                <Label>Module (optional)</Label>
                <Select name="moduleId">
                  <SelectTrigger>
                    <SelectValue placeholder="All modules" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All modules</SelectItem>
                    <SelectItem value="gate-pass">Gate Pass</SelectItem>
                    <SelectItem value="leave">Leave</SelectItem>
                    <SelectItem value="mrf">MRF</SelectItem>
                    <SelectItem value="purchase-request">Purchase Request</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Start Date</Label>
                  <Input name="startDate" type="date" required />
                </div>
                <div className="space-y-1.5">
                  <Label>End Date</Label>
                  <Input name="endDate" type="date" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Reason</Label>
                <Input name="reason" placeholder="e.g., On vacation" required />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Delegation</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          <EnterpriseDataTable
            data={delegations}
            columns={columns}
            keyExtractor={(row) => row.id}
            searchable
            searchPlaceholder="Search delegations..."
            exportable
            filename="delegations"
            emptyState={
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <UserCheck className="size-12 text-muted-foreground/30" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">No delegations</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Create a delegation rule to transfer approval authority
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
