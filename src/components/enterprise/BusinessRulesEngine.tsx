// Business Rules Engine - ERP Configuration
import { useState } from "react";
import { EnterpriseDataTable, type Column } from "@/components/enterprise/EnterpriseDataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, BrainCircuit, GripVertical } from "lucide-react";
import { getBusinessRules, createBusinessRule, deleteBusinessRule } from "@/services/config-engine";
import type { BusinessRule } from "@/types/configuration";
import type { ModuleId } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function BusinessRulesEngine() {
  const [rules, setRules] = useState<BusinessRule[]>(getBusinessRules());
  const [showCreate, setShowCreate] = useState(false);

  const refresh = () => setRules(getBusinessRules());

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    createBusinessRule({
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || "",
      moduleId: formData.get("moduleId") as ModuleId,
      priority: Number(formData.get("priority")) || 1,
      conditions: [{ field: "amount", operator: "gt", value: 0 }],
      actions: [{ type: "notify", target: "role", value: "manager" }],
      active: true,
    });
    refresh();
    setShowCreate(false);
    form.reset();
  };

  const handleDelete = (id: string) => {
    deleteBusinessRule(id);
    refresh();
  };

  const columns: Column<BusinessRule>[] = [
    { id: "name", header: "Rule Name", accessorKey: "name", sortable: true, filterable: true,
      cell: (val) => <span className="font-medium">{String(val)}</span>
    },
    { id: "moduleId", header: "Module", accessorKey: "moduleId", sortable: true, width: "140px",
      cell: (val) => <span className="capitalize">{String(val).replace("-", " ")}</span>
    },
    { id: "description", header: "Description", accessorKey: "description" },
    { id: "priority", header: "Priority", accessorKey: "priority", sortable: true, width: "80px",
      cell: (val) => <Badge variant="secondary" className="text-xs">{String(val)}</Badge>
    },
    { id: "conditions", header: "Conditions", accessorKey: "conditions", width: "120px",
      cell: (val) => <Badge variant="outline" className="text-xs">{(val as unknown[]).length} condition(s)</Badge>
    },
    { id: "actions", header: "Actions", accessorKey: "actions", width: "100px",
      cell: (val) => <Badge variant="outline" className="text-xs">{(val as unknown[]).length} action(s)</Badge>
    },
    { id: "active", header: "Status", accessorKey: "active", width: "80px",
      cell: (val) => val ? <Badge className="text-xs bg-success/10 text-success">Active</Badge> : <Badge variant="secondary" className="text-xs">Inactive</Badge>
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Business Rules Engine</h3>
          <p className="text-sm text-muted-foreground">IF-THEN rules that dynamically modify workflows at runtime</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="size-4" />New Rule</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create Business Rule</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Rule Name</Label>
                <Input name="name" placeholder="e.g., High-value Purchase → Finance" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Module</Label>
                  <Select name="moduleId" required>
                    <SelectTrigger><SelectValue placeholder="Select module" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gate-pass">Gate Pass</SelectItem>
                      <SelectItem value="leave">Leave</SelectItem>
                      <SelectItem value="mrf">MRF</SelectItem>
                      <SelectItem value="purchase-request">Purchase Request</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <Input name="priority" type="number" defaultValue="1" min="1" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea name="description" placeholder="Describe what this rule does..." rows={2} />
              </div>
              <p className="text-xs text-muted-foreground italic">
                After creating the rule, you can define conditions and actions in the detail view.
              </p>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
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
            searchPlaceholder="Search business rules..."
            exportable
            filename="business-rules"
            emptyState={
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <BrainCircuit className="size-12 text-muted-foreground/30" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">No business rules</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Create rules to dynamically modify workflows</p>
                </div>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}