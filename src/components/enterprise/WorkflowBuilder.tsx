// Workflow Builder - Admin configurable approval workflows
import { useState, useMemo } from "react";
import { EnterpriseDataTable, type Column } from "@/components/enterprise/EnterpriseDataTable";
import { StatusBadgeEnhanced } from "@/components/enterprise/StatusBadgeEnhanced";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Plus,
  Settings2,
  Copy,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ArrowUp,
  ArrowDown,
  GitBranch,
  Clock,
  AlertTriangle,
  Users,
  GripVertical,
  Workflow,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getWorkflows,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  duplicateWorkflow,
  toggleWorkflow,
  addWorkflowStep,
  removeWorkflowStep,
  updateWorkflowStep,
} from "@/services/approval-engine";
import type { WorkflowConfig, WorkflowStep } from "@/types/approval";
import type { RoleId, ModuleId } from "@/types";
import { ROLES } from "@/rbac/roles";
import { MODULES } from "@/navigation/nav";
import { cn } from "@/lib/utils";

export function WorkflowBuilder() {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<WorkflowConfig[]>(getWorkflows());
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowConfig | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showStepDialog, setShowStepDialog] = useState(false);
  const [editingStep, setEditingStep] = useState<WorkflowStep | null>(null);

  const refresh = () => setWorkflows(getWorkflows());

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    createWorkflow({
      moduleId: formData.get("moduleId") as ModuleId,
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || "",
      active: true,
      steps: [],
    });
    refresh();
    setShowCreate(false);
    form.reset();
  };

  const handleAddStep = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedWorkflow) return;
    const form = e.currentTarget;
    const formData = new FormData(form);
    addWorkflowStep(selectedWorkflow.id, {
      name: formData.get("name") as string,
      role: formData.get("role") as RoleId,
      required: formData.get("required") === "true",
      label: formData.get("label") as string,
      description: (formData.get("description") as string) || "",
      autoApprove: formData.get("autoApprove") === "true",
      escalationEnabled: formData.get("escalationEnabled") === "true",
      escalationToRole: (formData.get("escalationToRole") as RoleId) || undefined,
      escalationHours: formData.get("escalationHours")
        ? Number(formData.get("escalationHours"))
        : undefined,
    });
    refresh();
    setShowStepDialog(false);
    form.reset();
  };

  const handleDelete = (id: string) => {
    deleteWorkflow(id);
    refresh();
    if (selectedWorkflow?.id === id) setSelectedWorkflow(null);
  };

  const handleToggle = (id: string) => {
    toggleWorkflow(id);
    refresh();
  };

  const handleDuplicate = (id: string) => {
    duplicateWorkflow(id);
    refresh();
  };

  const handleUpdateStep = (
    stepId: string,
    updates: Partial<WorkflowStep>,
  ) => {
    if (!selectedWorkflow) return;
    updateWorkflowStep(selectedWorkflow.id, stepId, updates);
    refresh();
  };

  const handleRemoveStep = (stepId: string) => {
    if (!selectedWorkflow) return;
    removeWorkflowStep(selectedWorkflow.id, stepId);
    refresh();
  };

  const handleMoveStep = (index: number, direction: "up" | "down") => {
    if (!selectedWorkflow) return;
    const steps = [...selectedWorkflow.steps];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= steps.length) return;
    [steps[index], steps[newIndex]] = [steps[newIndex], steps[index]];
    steps.forEach((s, i) => (s.order = i + 1));
    updateWorkflow(selectedWorkflow.id, { steps });
    refresh();
  };

  const columns: Column<WorkflowConfig>[] = [
    {
      id: "name",
      header: "Workflow",
      accessorKey: "name",
      sortable: true,
      filterable: true,
      cell: (val, row) => (
        <div className="flex items-center gap-2">
          <GitBranch className="size-4 text-primary" />
          <span className="font-medium">{String(val)}</span>
          <Badge variant="outline" className="text-[10px]">
            v{row.version}
          </Badge>
        </div>
      ),
    },
    {
      id: "moduleId",
      header: "Module",
      accessorKey: "moduleId",
      sortable: true,
      cell: (val) => (
        <span className="capitalize">
          {String(val).replace("-", " ")}
        </span>
      ),
    },
    {
      id: "description",
      header: "Description",
      accessorKey: "description",
    },
    {
      id: "steps",
      header: "Steps",
      accessorKey: "steps",
      width: "100px",
      cell: (val) => (
        <Badge variant="secondary" className="text-xs">
          {(val as WorkflowStep[]).length} steps
        </Badge>
      ),
    },
    {
      id: "active",
      header: "Status",
      accessorKey: "active",
      width: "100px",
      cell: (val) => (
        <Badge
          variant={val ? "default" : "secondary"}
          className={cn(
            "text-xs",
            (val as boolean) && "bg-success/10 text-success hover:bg-success/20",
          )}
        >
          {val ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      accessorKey: "id",
      width: "160px",
      cell: (_, row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="size-7" onClick={() => handleDuplicate(row.id)} title="Duplicate">
            <Copy className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="size-7" onClick={() => handleToggle(row.id)} title={row.active ? "Deactivate" : "Activate"}>
            {row.active ? <ToggleRight className="size-3.5 text-success" /> : <ToggleLeft className="size-3.5 text-muted-foreground" />}
          </Button>
          <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => handleDelete(row.id)} title="Delete">
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Workflow List */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Approval Workflows</h3>
          <p className="text-sm text-muted-foreground">
            Configure approval flows per module. Each workflow defines the sequence of approvers.
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" />
              New Workflow
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Workflow</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Workflow Name</Label>
                <Input name="name" placeholder="e.g., Gate Pass Approval Flow" required />
              </div>
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
                    <SelectItem value="visitors">Visitors</SelectItem>
                    <SelectItem value="vehicles">Vehicles</SelectItem>
                    <SelectItem value="assets">Assets</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea name="description" placeholder="Describe this workflow..." />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Workflow</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          <EnterpriseDataTable
            data={workflows}
            columns={columns}
            keyExtractor={(row) => row.id}
            searchable
            searchPlaceholder="Search workflows..."
            onRowClick={(row) => setSelectedWorkflow(row)}
            emptyState={
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <GitBranch className="size-12 text-muted-foreground/30" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">No workflows configured</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Create approval workflows for each module
                  </p>
                </div>
              </div>
            }
          />
        </CardContent>
      </Card>

      {/* Workflow Detail */}
      {selectedWorkflow && (
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <GitBranch className="size-4 text-primary" />
                {selectedWorkflow.name}
                <Badge variant="outline" className="text-[10px]">
                  v{selectedWorkflow.version}
                </Badge>
                <Badge
                  variant={selectedWorkflow.active ? "default" : "secondary"}
                  className={cn(
                    "text-[10px]",
                    selectedWorkflow.active && "bg-success/10 text-success",
                  )}
                >
                  {selectedWorkflow.active ? "Active" : "Inactive"}
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedWorkflow.description} — Module:{" "}
                <span className="capitalize font-medium">
                  {selectedWorkflow.moduleId.replace("-", " ")}
                </span>
              </p>
            </div>
            <Dialog open={showStepDialog} onOpenChange={setShowStepDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Plus className="size-3.5" />
                  Add Step
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add Approval Step</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddStep} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Step Name</Label>
                      <Input name="name" placeholder="e.g., Supervisor Review" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Role</Label>
                      <Select name="role" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ROLES).map(([id, role]) => (
                            <SelectItem key={id} value={id}>
                              {role.shortName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Display Label</Label>
                    <Input name="label" placeholder="e.g., Supervisor Review" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Description (optional)</Label>
                    <Input name="description" placeholder="What happens at this step?" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <Switch name="required" defaultChecked />
                      <Label className="text-sm">Required step</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch name="autoApprove" />
                      <Label className="text-sm">Auto-approve</Label>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <AlertTriangle className="size-4 text-warning-foreground" />
                      Escalation Settings
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch name="escalationEnabled" />
                      <Label className="text-sm">Enable escalation on timeout</Label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Escalate to Role</Label>
                        <Select name="escalationToRole">
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(ROLES).map(([id, role]) => (
                              <SelectItem key={id} value={id}>
                                {role.shortName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Timeout (hours)</Label>
                        <Input name="escalationHours" type="number" placeholder="e.g., 24" min="1" />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setShowStepDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Add Step</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedWorkflow.steps.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <GitBranch className="size-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No steps configured yet</p>
                  <p className="text-xs text-muted-foreground/60">
                    Add approval steps to define the workflow
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedWorkflow.steps
                    .sort((a, b) => a.order - b.order)
                    .map((step, index) => (
                      <div
                        key={step.id}
                        className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                      >
                        {/* Step number */}
                        <div className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {step.order}
                        </div>

                        {/* Step details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">
                              {step.name}
                            </span>
                            <Badge variant="secondary" className="text-[10px]">
                              {ROLES[step.role]?.shortName || step.role}
                            </Badge>
                            {!step.required && (
                              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                Optional
                              </Badge>
                            )}
                            {step.autoApprove && (
                              <Badge variant="outline" className="text-[10px] text-success">
                                Auto
                              </Badge>
                            )}
                            {step.escalationEnabled && (
                              <Badge variant="outline" className="text-[10px] text-warning-foreground">
                                <Clock className="size-2.5 mr-0.5" />
                                {step.escalationHours}h
                              </Badge>
                            )}
                          </div>
                          {step.label && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {step.label}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            disabled={index === 0}
                            onClick={() => handleMoveStep(index, "up")}
                          >
                            <ArrowUp className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            disabled={index === selectedWorkflow.steps.length - 1}
                            onClick={() => handleMoveStep(index, "down")}
                          >
                            <ArrowDown className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-destructive"
                            onClick={() => handleRemoveStep(step.id)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}