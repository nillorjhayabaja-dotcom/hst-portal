// Gate Pass Module - Uses Enterprise Core Framework with Real Backend
import { useState, useEffect, useCallback } from "react";
import {
  RequestListPage,
  type ModuleConfig,
} from "@/components/enterprise/RequestFramework";
import { UniversalKpiCard } from "@/components/enterprise/UniversalKpiCard";
import { QuickActionCards } from "@/components/enterprise/QuickActionCards";
import { gatePassApi, type GatePass, type WorkflowStatus } from "@/services/gate-pass-api";
import { DoorOpen, Clock, CheckCircle, XCircle, Truck } from "lucide-react";
import { StatusBadgeEnhanced } from "@/components/enterprise/StatusBadgeEnhanced";
import { toast } from "sonner";
import type { Column } from "@/components/enterprise/EnterpriseDataTable";
import { GatePassForm } from "./GatePassForm";
import { GatePassDetailsDrawer } from "@/components/enterprise/GatePassDetailsDrawer";
import {
  getEmployeeDisplayName,
  getDepartmentName,
} from "@/utils/display";

const MODULE_CONFIG: ModuleConfig = {
  moduleId: "gate-pass",
  moduleName: "Gate Pass",
  moduleIcon: "DoorOpen",
  controlPrefix: "GP",
  createLabel: "New Gate Pass",
  description: "Create, route and release gate passes for outgoing items",
};

const GATE_PASS_ACTIONS = [
  {
    id: "qa1",
    label: "New Gate Pass",
    description: "Create a gate pass request",
    icon: "DoorOpen",
    action: "create",
    color: "blue" as const,
  },
  {
    id: "qa2",
    label: "Vehicle Log",
    description: "View vehicle exit records",
    icon: "Truck",
    action: "vehicles",
    color: "teal" as const,
  },
  {
    id: "qa3",
    label: "Gate Reports",
    description: "Monthly gate pass reports",
    icon: "BarChart3",
    action: "reports",
    color: "orange" as const,
  },
];

const GATE_COLUMNS: Column<GatePass>[] = [
  {
    id: "controlNumber",
    header: "Control No.",
    accessorKey: "controlNumber",
    sortable: true,
    width: "160px",
    cell: (_: any, row: GatePass) => (
      <span className="font-mono text-xs font-medium">{row.controlNumber}</span>
    ),
  },
  {
    id: "purpose",
    header: "Purpose",
    accessorKey: "purpose",
    sortable: true,
    filterable: true,
  },
  {
    id: "destination",
    header: "Destination",
    accessorKey: "destination",
    sortable: true,
  },
  {
    id: "requester",
    header: "Requester",
    accessorKey: "requester",
    sortable: true,
    cell: (_: any, row: GatePass) => (
      <span>{getEmployeeDisplayName(row.requester)}</span>
    ),
  },
  {
    id: "department",
    header: "Department",
    accessorKey: "department",
    sortable: true,
    cell: (_: any, row: GatePass) => (
      <span>{getDepartmentName(row.department) || getDepartmentName(row.requester?.department) || 'N/A'}</span>
    ),
  },
  {
    id: "currentStep",
    header: "Current Step",
    accessorKey: "currentStep",
    sortable: true,
    width: "180px",
    cell: (_: any, row: GatePass) => (
      <span>{row.currentStep?.name || 'N/A'}</span>
    ),
  },
  {
    id: "status",
    header: "Status",
    accessorKey: "status",
    sortable: true,
    width: "140px",
    cell: (val: any) => <StatusBadgeEnhanced status={String(val)} />,
  },
  {
    id: "createdAt",
    header: "Date Requested",
    accessorKey: "createdAt",
    sortable: true,
    width: "120px",
    cell: (_: any, row: GatePass) => (
      <span>{new Date(row.createdAt).toLocaleDateString()}</span>
    ),
  },
];

export function GatePassModule() {
  const [selectedRequest, setSelectedRequest] = useState<GatePass | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowStatus | null>(null);
  const [gatePasses, setGatePasses] = useState<GatePass[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [dataLoading, setDataLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Fetch gate passes from backend
  const fetchGatePasses = useCallback(async () => {
    try {
      setDataLoading(true);
      const result = await gatePassApi.getAll({ pageSize: 100 });
      const passes = result.data;
      
      setGatePasses(passes);
      
      // Calculate stats using HST workflow statuses
      const total = passes.length;
      const pending = passes.filter((p: GatePass) => ["pending", "in_review"].includes(p.status)).length;
      const approved = passes.filter((p: GatePass) => ["approved", "released"].includes(p.status)).length;
      const rejected = passes.filter((p: GatePass) => ["rejected", "returned", "cancelled"].includes(p.status)).length;
      
      setStats({ total, pending, approved, rejected });
    } catch (error) {
      console.error("Failed to fetch gate passes:", error);
      toast.error("Failed to load gate passes");
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGatePasses();
  }, [fetchGatePasses]);

  const handleCreate = () => {
    setShowForm(true);
  };

  const handleRowClick = async (row: GatePass) => {
    setSelectedRequest(row);
    setDrawerOpen(true);
    // Fetch workflow status
    try {
      const workflow = await gatePassApi.getWorkflowStatus(row.requestId);
      setSelectedWorkflow(workflow);
    } catch (error) {
      console.error("Failed to fetch workflow status:", error);
      setSelectedWorkflow(null);
    }
  };

  const handleRefresh = async () => {
    await fetchGatePasses();
    // Re-fetch workflow if drawer is open
    if (selectedRequest && drawerOpen) {
      try {
        const workflow = await gatePassApi.getWorkflowStatus(selectedRequest.requestId);
        setSelectedWorkflow(workflow);
      } catch {
        setSelectedWorkflow(null);
      }
    }
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedRequest(null);
    setSelectedWorkflow(null);
  };

  // Recalculate stats
  const recalcStats = useCallback((passes: GatePass[]) => {
    const total = passes.length;
    const pending = passes.filter((p: GatePass) => ["pending", "in_review"].includes(p.status)).length;
    const approved = passes.filter((p: GatePass) => ["approved", "released"].includes(p.status)).length;
    const rejected = passes.filter((p: GatePass) => ["rejected", "returned", "cancelled"].includes(p.status)).length;
    setStats({ total, pending, approved, rejected });
  }, []);

  const kpiCards = dataLoading ? null : (
    <>
      <UniversalKpiCard
        label="Total Gate Passes"
        value={stats.total}
        icon={DoorOpen}
        tone="primary"
      />
      <UniversalKpiCard
        label="Pending"
        value={stats.pending}
        icon={Clock}
        tone="warning"
      />
      <UniversalKpiCard
        label="Approved"
        value={stats.approved}
        icon={CheckCircle}
        tone="success"
      />
      <UniversalKpiCard label="Rejected" value={stats.rejected} icon={XCircle} tone="danger" />
    </>
  );

  return (
    <>
      <RequestListPage
        config={MODULE_CONFIG}
        data={gatePasses as any[]}
        columns={GATE_COLUMNS as any[]}
        onCreateNew={handleCreate}
        onRowClick={(row) => handleRowClick(row as unknown as GatePass)}
        kpiCards={kpiCards}
        quickActions={<QuickActionCards actions={GATE_PASS_ACTIONS} columns={3} />}
        searchPlaceholder="Search gate passes by control no., purpose, requester..."
        filename="gate-pass-list"
        loading={dataLoading}
      />

      <GatePassForm
        open={showForm}
        onOpenChange={setShowForm}
        onSuccess={() => {
          fetchGatePasses().catch(() => {});
        }}
      />

      {selectedRequest && (
        <GatePassDetailsDrawer
          gatePass={selectedRequest}
          workflowStatus={selectedWorkflow}
          open={drawerOpen}
          onClose={handleDrawerClose}
          onRefresh={handleRefresh}
        />
      )}
    </>
  );
}