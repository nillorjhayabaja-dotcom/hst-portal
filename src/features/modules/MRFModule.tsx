// MRF Module - Uses Enterprise Core Framework
import { useState } from "react";
import { RequestListPage, RequestDetailsDrawer, type RequestData, type ModuleConfig } from "@/components/enterprise/RequestFramework";
import { UniversalKpiCard } from "@/components/enterprise/UniversalKpiCard";
import { QuickActionCards } from "@/components/enterprise/QuickActionCards";
import { REQUESTS } from "@/mock/data";
import { MOCK_COMMENTS, MOCK_ATTACHMENTS, MOCK_TIMELINE_EVENTS } from "@/mock/enterprise-data";
import { Users, Clock, CheckCircle, XCircle, UserPlus } from "lucide-react";
import { StatusBadgeEnhanced } from "@/components/enterprise/StatusBadgeEnhanced";
import { ApproveDialog, RejectDialog, ReturnDialog } from "@/components/enterprise/EnterpriseDialogs";
import { toast } from "sonner";
import type { Column } from "@/components/enterprise/EnterpriseDataTable";

const MODULE_CONFIG: ModuleConfig = {
  moduleId: "mrf",
  moduleName: "MRF",
  moduleIcon: "Users",
  controlPrefix: "MRF",
  createLabel: "New MRF",
  description: "Manpower requisition forms",
};

const MRF_ACTIONS = [
  { id: "qa1", label: "New MRF", description: "Request additional manpower", icon: "UserPlus", action: "create", color: "purple" as const },
  { id: "qa2", label: "Open Positions", description: "View current openings", icon: "Users", action: "positions", color: "blue" as const },
  { id: "qa3", label: "Hiring Reports", description: "Recruitment analytics", icon: "BarChart3", action: "reports", color: "teal" as const },
];

const MRF_COLUMNS: Column<RequestData>[] = [
  { id: "controlNumber", header: "Control No.", accessorKey: "controlNumber", sortable: true, width: "160px",
    cell: (_, row) => <span className="font-mono text-xs font-medium">{String(row.controlNumber)}</span>
  },
  { id: "title", header: "Position", accessorKey: "title", sortable: true, filterable: true },
  { id: "requester", header: "Requested By", accessorKey: "requester", sortable: true },
  { id: "department", header: "Department", accessorKey: "department", sortable: true },
  { id: "status", header: "Status", accessorKey: "status", sortable: true, width: "140px",
    cell: (val) => <StatusBadgeEnhanced status={String(val)} />
  },
  { id: "priority", header: "Priority", accessorKey: "priority", sortable: true, width: "100px",
    cell: (val) => <StatusBadgeEnhanced status={String(val)} />
  },
  { id: "createdAt", header: "Date", accessorKey: "createdAt", sortable: true, width: "120px" },
];

export function MRFModule() {
  const [selectedRequest, setSelectedRequest] = useState<RequestData | null>(null);
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showReturn, setShowReturn] = useState(false);

  const mrfs = REQUESTS.filter((r) => r.type === "MRF").map((r) => ({ ...r, type: r.type }));

  const stats = {
    total: mrfs.length,
    pending: mrfs.filter((r) => ["Pending", "In Review"].includes(r.status)).length,
    approved: mrfs.filter((r) => ["Approved", "Completed"].includes(r.status)).length,
    rejected: mrfs.filter((r) => ["Rejected", "Returned"].includes(r.status)).length,
  };

  const handleApprove = (note?: string) => { toast.success("MRF approved"); setShowApprove(false); setSelectedRequest(null); };
  const handleReject = (note?: string) => { toast.error("MRF rejected"); setShowReject(false); setSelectedRequest(null); };
  const handleReturn = (note?: string) => { toast.warning("MRF returned"); setShowReturn(false); setSelectedRequest(null); };

  const kpiCards = (
    <>
      <UniversalKpiCard label="Total MRFs" value={stats.total} icon={Users} tone="primary" />
      <UniversalKpiCard label="Pending" value={stats.pending} icon={Clock} tone="warning" />
      <UniversalKpiCard label="Approved" value={stats.approved} icon={CheckCircle} tone="success" trend={{ value: "78% fill rate", up: true }} />
      <UniversalKpiCard label="Rejected" value={stats.rejected} icon={XCircle} tone="danger" />
    </>
  );

  return (
    <>
      <RequestListPage
        config={MODULE_CONFIG}
        data={mrfs as RequestData[]}
        columns={MRF_COLUMNS}
        onRowClick={(row) => setSelectedRequest(row)}
        kpiCards={kpiCards}
        quickActions={<QuickActionCards actions={MRF_ACTIONS} columns={3} />}
        searchPlaceholder="Search MRF by control no., position, department..."
        filename="mrf-list"
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