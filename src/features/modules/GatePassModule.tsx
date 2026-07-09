// Gate Pass Module - Uses Enterprise Core Framework
import { useState } from "react";
import { RequestListPage, RequestDetailsDrawer, type RequestData, type ModuleConfig } from "@/components/enterprise/RequestFramework";
import { UniversalKpiCard } from "@/components/enterprise/UniversalKpiCard";
import { QuickActionCards } from "@/components/enterprise/QuickActionCards";
import { useAuth } from "@/contexts/AuthContext";
import { REQUESTS, VEHICLES } from "@/mock/data";
import { MOCK_COMMENTS, MOCK_ATTACHMENTS, MOCK_TIMELINE_EVENTS, MOCK_QUICK_ACTIONS } from "@/mock/enterprise-data";
import { DoorOpen, ClipboardList, Clock, CheckCircle, XCircle, Truck } from "lucide-react";
import { StatusBadgeEnhanced } from "@/components/enterprise/StatusBadgeEnhanced";
import { ApproveDialog, RejectDialog, ReturnDialog } from "@/components/enterprise/EnterpriseDialogs";
import { toast } from "sonner";
import type { Column } from "@/components/enterprise/EnterpriseDataTable";

const MODULE_CONFIG: ModuleConfig = {
  moduleId: "gate-pass",
  moduleName: "Gate Pass",
  moduleIcon: "DoorOpen",
  controlPrefix: "GP",
  createLabel: "New Gate Pass",
  description: "Create, route and release gate passes for outgoing items",
};

const GATE_PASS_ACTIONS = [
  { id: "qa1", label: "New Gate Pass", description: "Create a gate pass request", icon: "DoorOpen", action: "create", color: "blue" as const },
  { id: "qa2", label: "Vehicle Log", description: "View vehicle exit records", icon: "Truck", action: "vehicles", color: "teal" as const },
  { id: "qa3", label: "Gate Reports", description: "Monthly gate pass reports", icon: "BarChart3", action: "reports", color: "orange" as const },
];

const GATE_COLUMNS: Column<RequestData>[] = [
  { id: "controlNumber", header: "Control No.", accessorKey: "controlNumber", sortable: true, width: "160px",
    cell: (_, row) => <span className="font-mono text-xs font-medium">{String(row.controlNumber)}</span>
  },
  { id: "title", header: "Purpose", accessorKey: "title", sortable: true, filterable: true },
  { id: "requester", header: "Requester", accessorKey: "requester", sortable: true },
  { id: "department", header: "Department", accessorKey: "department", sortable: true },
  { id: "status", header: "Status", accessorKey: "status", sortable: true, width: "140px",
    cell: (val) => <StatusBadgeEnhanced status={String(val)} />
  },
  { id: "priority", header: "Priority", accessorKey: "priority", sortable: true, width: "100px",
    cell: (val) => <StatusBadgeEnhanced status={String(val)} />
  },
  { id: "createdAt", header: "Date", accessorKey: "createdAt", sortable: true, width: "120px" },
];

export function GatePassModule() {
  const { user } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<RequestData | null>(null);
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showReturn, setShowReturn] = useState(false);

  const gatePasses = REQUESTS.filter((r) => r.type === "Gate Pass").map((r) => ({
    ...r,
    type: r.type,
  }));

  const stats = {
    total: gatePasses.length,
    pending: gatePasses.filter((r) => ["Pending", "In Review"].includes(r.status)).length,
    approved: gatePasses.filter((r) => ["Approved", "Completed"].includes(r.status)).length,
    rejected: gatePasses.filter((r) => ["Rejected", "Returned"].includes(r.status)).length,
  };

  const handleCreate = () => {
    toast.success("New Gate Pass form opened", { description: "Create a gate pass request" });
  };

  const handleApprove = (note?: string) => {
    toast.success("Gate pass approved", { description: note });
    setShowApprove(false);
    setSelectedRequest(null);
  };

  const handleReject = (note?: string) => {
    toast.error("Gate pass rejected", { description: note });
    setShowReject(false);
    setSelectedRequest(null);
  };

  const handleReturn = (note?: string) => {
    toast.warning("Gate pass returned", { description: note });
    setShowReturn(false);
    setSelectedRequest(null);
  };

  const kpiCards = (
    <>
      <UniversalKpiCard label="Total Gate Passes" value={stats.total} icon={DoorOpen} tone="primary" />
      <UniversalKpiCard label="Pending" value={stats.pending} icon={Clock} tone="warning" trend={{ value: "3 new today", up: true }} />
      <UniversalKpiCard label="Approved" value={stats.approved} icon={CheckCircle} tone="success" trend={{ value: "85% rate", up: true }} />
      <UniversalKpiCard label="Rejected" value={stats.rejected} icon={XCircle} tone="danger" />
    </>
  );

  return (
    <>
      <RequestListPage
        config={MODULE_CONFIG}
        data={gatePasses as RequestData[]}
        columns={GATE_COLUMNS}
        onCreateNew={handleCreate}
        onRowClick={(row) => setSelectedRequest(row)}
        kpiCards={kpiCards}
        quickActions={<QuickActionCards actions={GATE_PASS_ACTIONS} columns={3} />}
        searchPlaceholder="Search gate passes by control no., purpose, requester..."
        filename="gate-pass-list"
      />

      {selectedRequest && (
        <RequestDetailsDrawer
          request={selectedRequest}
          config={MODULE_CONFIG}
          onClose={() => setSelectedRequest(null)}
          onApprove={() => setShowApprove(true)}
          onReject={() => setShowReject(true)}
          onReturn={() => setShowReturn(true)}
          timeline={MOCK_TIMELINE_EVENTS}
          comments={MOCK_COMMENTS}
          attachments={MOCK_ATTACHMENTS}
        />
      )}

      <ApproveDialog open={showApprove} onOpenChange={setShowApprove} onConfirm={handleApprove} />
      <RejectDialog open={showReject} onOpenChange={setShowReject} onConfirm={handleReject} />
      <ReturnDialog open={showReturn} onOpenChange={setShowReturn} onConfirm={handleReturn} />
    </>
  );
}