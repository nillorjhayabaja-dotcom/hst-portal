// Leave Module - Uses Enterprise Core Framework
import { useState } from "react";
import {
  RequestListPage,
  RequestDetailsDrawer,
  type RequestData,
  type ModuleConfig,
} from "@/components/enterprise/RequestFramework";
import { UniversalKpiCard } from "@/components/enterprise/UniversalKpiCard";
import { QuickActionCards } from "@/components/enterprise/QuickActionCards";
import { REQUESTS } from "@/mock/data";
import { MOCK_COMMENTS, MOCK_ATTACHMENTS, MOCK_TIMELINE_EVENTS } from "@/mock/enterprise-data";
import { CalendarCheck, Clock, CheckCircle, XCircle, TrendingUp, Users } from "lucide-react";
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
import {
  getEmployeeDisplayName,
  getDepartmentName,
} from "@/utils/display";

const MODULE_CONFIG: ModuleConfig = {
  moduleId: "leave",
  moduleName: "Leave",
  moduleIcon: "CalendarCheck",
  controlPrefix: "LV",
  createLabel: "File Leave",
  description: "Request and approve employee leave",
};

const LEAVE_ACTIONS = [
  {
    id: "qa1",
    label: "File Leave",
    description: "Submit a leave request",
    icon: "CalendarCheck",
    action: "create",
    color: "green" as const,
  },
  {
    id: "qa2",
    label: "Leave Calendar",
    description: "Team leave calendar",
    icon: "Users",
    action: "calendar",
    color: "blue" as const,
  },
  {
    id: "qa3",
    label: "Leave Reports",
    description: "Leave utilization reports",
    icon: "BarChart3",
    action: "reports",
    color: "purple" as const,
  },
];

const LEAVE_COLUMNS: Column<RequestData>[] = [
  {
    id: "controlNumber",
    header: "Control No.",
    accessorKey: "controlNumber",
    sortable: true,
    width: "160px",
    cell: (_, row) => (
      <span className="font-mono text-xs font-medium">{String(row.controlNumber)}</span>
    ),
  },
  { id: "title", header: "Leave Type", accessorKey: "title", sortable: true, filterable: true },
  {
    id: "requester",
    header: "Employee",
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
  {
    id: "priority",
    header: "Priority",
    accessorKey: "priority",
    sortable: true,
    width: "100px",
    cell: (val) => <StatusBadgeEnhanced status={String(val)} />,
  },
  {
    id: "createdAt",
    header: "Date Filed",
    accessorKey: "createdAt",
    sortable: true,
    width: "120px",
  },
];

export function LeaveModule() {
  const { user } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<RequestData | null>(null);
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [loading, setLoading] = useState(false);

  const leaves = REQUESTS.filter((r) => r.type === "Leave").map((r) => ({ ...r, type: r.type }));

  const stats = {
    total: leaves.length,
    pending: leaves.filter((r) => ["Pending", "In Review"].includes(r.status)).length,
    approved: leaves.filter((r) => ["Approved", "Completed"].includes(r.status)).length,
    rejected: leaves.filter((r) => ["Rejected", "Returned"].includes(r.status)).length,
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
      <UniversalKpiCard
        label="Total Leave"
        value={stats.total}
        icon={CalendarCheck}
        tone="primary"
      />
      <UniversalKpiCard label="Pending" value={stats.pending} icon={Clock} tone="warning" />
      <UniversalKpiCard
        label="Approved"
        value={stats.approved}
        icon={CheckCircle}
        tone="success"
        trend={{ value: "92% approval", up: true }}
      />
      <UniversalKpiCard label="Rejected" value={stats.rejected} icon={XCircle} tone="danger" />
    </>
  );

  return (
    <>
      <RequestListPage
        config={MODULE_CONFIG}
        data={leaves as RequestData[]}
        columns={LEAVE_COLUMNS}
        onRowClick={(row) => setSelectedRequest(row)}
        kpiCards={kpiCards}
        quickActions={<QuickActionCards actions={LEAVE_ACTIONS} columns={3} />}
        searchPlaceholder="Search leave by control no., employee, department..."
        filename="leave-list"
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
