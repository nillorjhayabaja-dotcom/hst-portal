// MRF Module - Uses Enterprise Core Framework
import { useState } from "react";
import {
  RequestListPage,
  RequestDetailsDrawer,
  type RequestData,
  type ModuleConfig,
} from "@/components/enterprise/RequestFramework";
import { UniversalKpiCard } from "@/components/enterprise/UniversalKpiCard";
import { QuickActionCards } from "@/components/enterprise/QuickActionCards";
import { Users, Clock, CheckCircle, XCircle, UserPlus } from "lucide-react";
import { StatusBadgeEnhanced } from "@/components/enterprise/StatusBadgeEnhanced";
import {
  ApproveDialog,
  RejectDialog,
  ReturnDialog,
} from "@/components/enterprise/EnterpriseDialogs";
import { toast } from "sonner";
import type { Column } from "@/components/enterprise/EnterpriseDataTable";
import { useAuth } from "@/contexts/AuthContext";
import { approveRequest, rejectRequest, returnRequest } from "@/services/approval-engine";
import { useApprovalRequests } from "@/services/approval-hooks";
import {
  getEmployeeDisplayName,
  getDepartmentName,
} from "@/utils/display";

const MODULE_CONFIG: ModuleConfig = {
  moduleId: "mrf",
  moduleName: "Manpower Request Form",
  moduleIcon: "Users",
  controlPrefix: "MRF",
  createLabel: "New MRF",
  description: "Request additional manpower",
};

const MRF_ACTIONS = [
  {
    id: "qa1",
    label: "New MRF",
    description: "Request additional manpower",
    icon: "UserPlus",
    action: "create",
    color: "purple" as const,
  },
  {
    id: "qa2",
    label: "Headcount Reports",
    description: "Manpower utilization reports",
    icon: "Users",
    action: "reports",
    color: "blue" as const,
  },
];

const MRF_COLUMNS: Column<RequestData>[] = [
  {
    id: "controlNumber",
    header: "MRF No.",
    accessorKey: "controlNumber",
    sortable: true,
    width: "160px",
    cell: (_, row) => (
      <span className="font-mono text-xs font-medium">{String(row.controlNumber)}</span>
    ),
  },
  { id: "title", header: "Position", accessorKey: "title", sortable: true, filterable: true },
  {
    id: "requester",
    header: "Requested By",
    accessorKey: "requester",
    sortable: true,
    cell: (value) => getEmployeeDisplayName(value as any),
  },
  {
    id: "department",
    header: "Department",
    accessorKey: "department",
    sortable: true,
    cell: (value) => getDepartmentName(value as any),
  },
  {
    id: "status",
    header: "Status",
    accessorKey: "status",
    sortable: true,
    width: "140px",
    cell: (val) => <StatusBadgeEnhanced status={String(val)} />,
  },
  { id: "createdAt", header: "Date Filed", accessorKey: "createdAt", sortable: true, width: "120px" },
];

export function MRFModule() {
  const { user } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<RequestData | null>(null);
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: approvalData } = useApprovalRequests({ moduleId: "mrf" });
  const mrfs = (approvalData?.data || []).map((r: any) => ({
    ...r,
    type: "MRF",
  }));

  const stats = {
    total: mrfs.length,
    pending: mrfs.filter((r: any) => ["Pending", "In Review"].includes(r.status)).length,
    approved: mrfs.filter((r: any) => ["Approved", "Completed"].includes(r.status)).length,
    rejected: mrfs.filter((r: any) => ["Rejected", "Returned"].includes(r.status)).length,
  };

  const handleApprove = (note?: string) => {
    if (!user || !selectedRequest) return;
    setLoading(true);
    approveRequest(selectedRequest.id, user.id, user.name, note);
    setLoading(false);
    setShowApprove(false);
    setSelectedRequest(null);
  };
  const handleReject = (note?: string) => {
    if (!user || !selectedRequest || !note) return;
    setLoading(true);
    rejectRequest(selectedRequest.id, user.id, user.name, note);
    setLoading(false);
    setShowReject(false);
    setSelectedRequest(null);
  };
  const handleReturn = (note?: string) => {
    if (!user || !selectedRequest || !note) return;
    setLoading(true);
    returnRequest(selectedRequest.id, user.id, user.name, note);
    setLoading(false);
    setShowReturn(false);
    setSelectedRequest(null);
  };

  const kpiCards = (
    <>
      <UniversalKpiCard label="Total MRFs" value={stats.total} icon={Users} tone="primary" />
      <UniversalKpiCard label="Pending" value={stats.pending} icon={Clock} tone="warning" />
      <UniversalKpiCard
        label="Approved"
        value={stats.approved}
        icon={CheckCircle}
        tone="success"
        trend={{ value: `${stats.approved} positions filled`, up: true }}
      />
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
          timeline={[]}
          comments={[]}
          attachments={[]}
        />
      )}

      <ApproveDialog
        open={showApprove}
        onOpenChange={setShowApprove}
        onConfirm={handleApprove}
        loading={loading}
      />
      <RejectDialog
        open={showReject}
        onOpenChange={setShowReject}
        onConfirm={handleReject}
        loading={loading}
      />
      <ReturnDialog
        open={showReturn}
        onOpenChange={setShowReturn}
        onConfirm={handleReturn}
        loading={loading}
      />
    </>
  );
}