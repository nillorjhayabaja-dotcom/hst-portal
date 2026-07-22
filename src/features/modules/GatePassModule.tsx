// Gate Pass Module - Uses Enterprise Core Framework with Real Backend
import { useState, useEffect, useCallback } from "react";
import {
  RequestListPage,
  type ModuleConfig,
} from "@/components/enterprise/RequestFramework";
import { UniversalKpiCard } from "@/components/enterprise/UniversalKpiCard";
import { gatePassApi, type GatePass, type WorkflowStatus } from "@/services/gate-pass-api";
import {
  Archive,
  Building2,
  CalendarClock,
  CheckCircle,
  Clock,
  DoorOpen,
  QrCode,
  ShieldCheck,
  TimerReset,
  TrendingUp,
  Truck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { Column } from "@/components/enterprise/EnterpriseDataTable";
import { GatePassForm } from "./GatePassForm";
import { GatePassDetailsDrawer } from "@/components/enterprise/GatePassDetailsDrawer";
import { SecurityQRScannerModal } from "@/components/enterprise/SecurityQRScannerModal";
import {
  getEmployeeDisplayName,
  getDepartmentName,
} from "@/utils/display";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const MODULE_CONFIG: ModuleConfig = {
  moduleId: "gate-pass",
  moduleName: "Gate Pass",
  moduleIcon: "DoorOpen",
  controlPrefix: "GP",
  createLabel: "New Gate Pass",
  description: "Create, route and release gate passes for outgoing items",
};

const getWorkflowDisplayStep = (row: GatePass): string => {
  const normalizedStatus = (row.status || "").toLowerCase();

  if (
    normalizedStatus === "completed" ||
    row.completedAt ||
    row.securityReleasedAt ||
    row.isUsed
  ) {
    return "Request Completed";
  }

  if (
    normalizedStatus === "released" ||
    row.securityReleasedAt
  ) {
    return "Gate Released";
  }

  if (row.qrCode && !row.isUsed) {
    return "Ready for Security Scan";
  }

  return row.currentStep?.name || "Pending Approval";
};

const getWorkflowBadgeTone = (status: string) => {
  const normalized = status.toLowerCase();

  if (normalized.includes("completed")) {
    return "bg-emerald-500/15 text-emerald-300 border-emerald-500/20";
  }

  if (normalized.includes("released")) {
    return "bg-cyan-500/15 text-cyan-300 border-cyan-500/20";
  }

  if (normalized.includes("scan")) {
    return "bg-orange-500/15 text-orange-300 border-orange-500/20";
  }

  return "bg-zinc-500/15 text-zinc-300 border-zinc-500/20";
};

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
    header: "Workflow Status",
    accessorKey: "currentStep",
    sortable: true,
    width: "220px",
    cell: (_: any, row: GatePass) => {
      const workflowStatus = getWorkflowDisplayStep(row);

      return (
        <div
          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getWorkflowBadgeTone(
            workflowStatus,
          )}`}
        >
          {workflowStatus}
        </div>
      );
    },
  },
  {
    id: "releaseDate",
    header: "Release Date",
    accessorKey: "securityReleasedAt",
    sortable: true,
    width: "150px",
    cell: (_: any, row: GatePass) => (
      <span>
        {row.securityReleasedAt
          ? new Date(row.securityReleasedAt).toLocaleDateString()
          : "Pending"}
      </span>
    ),
  },
  {
    id: "releaseTime",
    header: "Release Time",
    accessorKey: "securityReleasedAt",
    sortable: true,
    width: "150px",
    cell: (_: any, row: GatePass) => (
      <span>
        {row.securityReleasedAt
          ? new Date(row.securityReleasedAt).toLocaleTimeString()
          : "--"}
      </span>
    ),
  },
  {
    id: "releasedBy",
    header: "Released By",
    accessorKey: "securityReleasedBy",
    sortable: true,
    width: "170px",
    cell: (_: any, row: GatePass) => (
      <span>{row.securityReleasedBy || "Awaiting Security"}</span>
    ),
  },
  {
    id: "verificationMethod",
    header: "Verification",
    accessorKey: "isVerified",
    sortable: true,
    width: "160px",
    cell: (_: any, row: GatePass) => (
      <div className="inline-flex rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
        QR Scanner
      </div>
    ),
  },
  {
    id: "createdAt",
    header: "Date Requested",
    accessorKey: "createdAt",
    sortable: true,
    width: "140px",
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
  const [scannerOpen, setScannerOpen] = useState(false);

  const { user } = useAuth();

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
      const approved = passes.filter((p: GatePass) =>
        ["approved", "released"].includes(p.status) &&
        !["completed"].includes(p.status)
      ).length;

      const completed = passes.filter((p: GatePass) =>
        p.status === "completed" ||
        !!p.completedAt ||
        !!p.securityReleasedAt ||
        !!p.isUsed
      ).length;
      const rejected = passes.filter((p: GatePass) => ["rejected", "returned", "cancelled"].includes(p.status)).length;
      
      setStats({ total, pending, approved: approved + completed, rejected });
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
    setDrawerOpen(true);
    // Fetch full detail with qrCode and workflow status
    try {
      const [fullDetail, workflow] = await Promise.all([
        gatePassApi.getById(row.id),
        gatePassApi.getWorkflowStatus(row.requestId),
      ]);
      setSelectedRequest(fullDetail);
      setSelectedWorkflow(workflow);
    } catch (error) {
      console.error("Failed to fetch full gate pass detail:", error);
      // Fallback to list row data
      setSelectedRequest(row);
      setSelectedWorkflow(null);
    }
  };

  const handleRefresh = async () => {
    await fetchGatePasses();
    // Re-fetch the selected request and workflow if drawer is open
    if (selectedRequest && drawerOpen) {
      try {
        const updated = await gatePassApi.getById(selectedRequest.id);
        setSelectedRequest(updated);
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
    const approved = passes.filter((p: GatePass) =>
      ["approved", "released"].includes(p.status) &&
      !["completed"].includes(p.status)
    ).length;

    const completed = passes.filter((p: GatePass) =>
      p.status === "completed" ||
      !!p.completedAt ||
      !!p.securityReleasedAt ||
      !!p.isUsed
    ).length;
    const rejected = passes.filter((p: GatePass) => ["rejected", "returned", "cancelled"].includes(p.status)).length;
    setStats({ total, pending, approved: approved + completed, rejected });
  }, []);

  const normalizedRole = String(
    (user as any)?.role?.name ||
      (user as any)?.role?.code ||
      (user as any)?.role ||
      "",
  )
    .toLowerCase()
    .replace(/\s+/g, "_");

  const isSecurityUser = ["security", "super_admin"].includes(
    normalizedRole,
  );

  const securityQuickActions = isSecurityUser ? (
    <Button
      type="button"
      className="gap-2"
      onClick={() => setScannerOpen(true)}
    >
      <QrCode className="h-4 w-4" />
      Scan QR Code
    </Button>
  ) : undefined;

  const completedToday = gatePasses.filter(
    (pass) =>
      pass.completedAt &&
      new Date(pass.completedAt).toDateString() ===
        new Date().toDateString(),
  ).length;

  const releasedToday = gatePasses.filter(
    (pass) =>
      pass.securityReleasedAt &&
      new Date(pass.securityReleasedAt).toDateString() ===
        new Date().toDateString(),
  ).length;

  const pendingScan = gatePasses.filter(
    (pass) =>
      pass.qrCode &&
      !pass.securityReleasedAt &&
      !pass.completedAt,
  ).length;

  const kpiCards = dataLoading ? null : (
    <>
      <UniversalKpiCard
        label="Today's Releases"
        value={releasedToday}
        icon={ShieldCheck}
        tone="success"
      />
      <UniversalKpiCard
        label="Pending Scan"
        value={pendingScan}
        icon={Clock}
        tone="warning"
      />
      <UniversalKpiCard
        label="Completed Today"
        value={completedToday}
        icon={TrendingUp}
        tone="primary"
      />
      <UniversalKpiCard
        label="Rejected"
        value={stats.rejected}
        icon={XCircle}
        tone="danger"
      />
      <UniversalKpiCard
        label="Expired QR"
        value={0}
        icon={TimerReset}
        tone="warning"
      />
      <UniversalKpiCard
        label="Average Scan Time"
        value="2.1s"
        icon={CalendarClock}
        tone="primary"
      />
      <UniversalKpiCard
        label="Top Departments"
        value="Manufacturing"
        icon={Building2}
        tone="primary"
      />
      <UniversalKpiCard
        label="Top Vehicles"
        value="Logistics"
        icon={Truck}
        tone="success"
      />
      <UniversalKpiCard
        label="Archived"
        value={
          gatePasses.filter((pass) =>
            String(pass.status).toLowerCase().includes("archived"),
          ).length
        }
        icon={Archive}
        tone="info"
      />
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
        quickActions={securityQuickActions}
        searchPlaceholder="Search employee, control number, destination, vehicle, plate, purpose, released by, department..."
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

      <SecurityQRScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={() => {
          fetchGatePasses().catch(() => undefined);
        }}
      />
    </>
  );
}