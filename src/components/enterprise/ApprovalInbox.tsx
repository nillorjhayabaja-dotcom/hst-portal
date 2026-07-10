// Approval Inbox - Universal approval center for all modules
import { useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { EnterpriseDataTable, type Column } from "@/components/enterprise/EnterpriseDataTable";
import { StatusBadgeEnhanced } from "@/components/enterprise/StatusBadgeEnhanced";
import { UniversalTimeline } from "@/components/enterprise/UniversalTimeline";
import { RequestDetailsDrawer, type RequestData } from "@/components/enterprise/RequestFramework";
import {
  ApproveDialog,
  RejectDialog,
  ReturnDialog,
} from "@/components/enterprise/EnterpriseDialogs";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  UserCheck,
  FileText,
  AlertCircle,
} from "lucide-react";
import {
  getApprovalsForUser,
  getAllRequests,
  getRequestsByUser,
  approveRequest,
  rejectRequest,
  returnRequest,
} from "@/services/approval-engine";
import type { ApprovalRequest } from "@/types/approval";

export function ApprovalInbox() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");

  if (!user) return null;

  // Get approvals for current user's role
  const myApprovals = useMemo(() => getApprovalsForUser(user.id, user.role), [user.id, user.role]);

  // Get all requests for history view
  const allRequests = useMemo(() => getAllRequests(), []);

  // Get requests by current user
  const myRequests = useMemo(() => getRequestsByUser(user.id), [user.id]);

  const pendingCount = myApprovals.filter(
    (r) => r.status === "pending" || r.status === "in_review",
  ).length;
  const approvedCount = allRequests.filter((r) => r.status === "approved").length;
  const rejectedCount = allRequests.filter((r) => r.status === "rejected").length;

  const handleApprove = (note?: string) => {
    if (!selectedRequest) return;
    approveRequest(selectedRequest.id, user.id, user.name, note);
    setShowApprove(false);
    setSelectedRequest(null);
  };

  const handleReject = (reason?: string) => {
    if (!selectedRequest || !reason) return;
    rejectRequest(selectedRequest.id, user.id, user.name, reason);
    setShowReject(false);
    setSelectedRequest(null);
  };

  const handleReturn = (note?: string) => {
    if (!selectedRequest || !note) return;
    returnRequest(selectedRequest.id, user.id, user.name, note);
    setShowReturn(false);
    setSelectedRequest(null);
  };

  const columns: Column<ApprovalRequest>[] = [
    {
      id: "controlNumber",
      header: "Control No.",
      accessorKey: "controlNumber",
      sortable: true,
      width: "160px",
      cell: (val) => <span className="font-mono text-xs font-medium">{String(val)}</span>,
    },
    {
      id: "title",
      header: "Title",
      accessorKey: "title",
      sortable: true,
      filterable: true,
      cell: (val) => <span className="font-medium">{String(val)}</span>,
    },
    {
      id: "requesterName",
      header: "Requester",
      accessorKey: "requesterName",
      sortable: true,
    },
    {
      id: "department",
      header: "Department",
      accessorKey: "department",
      sortable: true,
    },
    {
      id: "moduleId",
      header: "Module",
      accessorKey: "moduleId",
      sortable: true,
      width: "140px",
      cell: (val) => <span className="capitalize">{String(val).replace("-", " ")}</span>,
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
      header: "Date",
      accessorKey: "createdAt",
      sortable: true,
      width: "120px",
      cell: (val) => <span className="text-xs">{new Date(String(val)).toLocaleDateString()}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
              <p className="mt-2 font-display text-3xl font-bold text-foreground">{pendingCount}</p>
            </div>
            <div className="grid size-11 place-items-center rounded-xl bg-warning/15 text-warning-foreground">
              <Clock className="size-5" />
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Awaiting your action</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Approved</p>
              <p className="mt-2 font-display text-3xl font-bold text-foreground">
                {approvedCount}
              </p>
            </div>
            <div className="grid size-11 place-items-center rounded-xl bg-success/10 text-success">
              <CheckCircle2 className="size-5" />
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Total approved</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Rejected</p>
              <p className="mt-2 font-display text-3xl font-bold text-foreground">
                {rejectedCount}
              </p>
            </div>
            <div className="grid size-11 place-items-center rounded-xl bg-destructive/10 text-destructive">
              <XCircle className="size-5" />
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Total rejected</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">My Requests</p>
              <p className="mt-2 font-display text-3xl font-bold text-foreground">
                {myRequests.length}
              </p>
            </div>
            <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
              <FileText className="size-5" />
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Total submitted</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-transparent p-0 border-b border-border w-full justify-start gap-4">
          <TabsTrigger
            value="pending"
            className="text-xs data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
          >
            <Inbox className="mr-1.5 size-3.5" />
            My Approvals ({pendingCount})
          </TabsTrigger>
          <TabsTrigger
            value="all"
            className="text-xs data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
          >
            <FileText className="mr-1.5 size-3.5" />
            All Requests ({allRequests.length})
          </TabsTrigger>
          <TabsTrigger
            value="mine"
            className="text-xs data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
          >
            <UserCheck className="mr-1.5 size-3.5" />
            My Requests ({myRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="m-0">
          <EnterpriseDataTable
            title="Approval Inbox"
            data={myApprovals}
            columns={columns}
            keyExtractor={(row) => row.id}
            searchable
            searchPlaceholder="Search pending approvals..."
            exportable
            filename="pending-approvals"
            onRowClick={(row) => setSelectedRequest(row)}
            emptyState={
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <CheckCircle2 className="size-12 text-success/30" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">All caught up!</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    No pending approvals in your queue
                  </p>
                </div>
              </div>
            }
          />
        </TabsContent>

        <TabsContent value="all" className="m-0">
          <EnterpriseDataTable
            title="All Requests"
            data={allRequests}
            columns={columns}
            keyExtractor={(row) => row.id}
            searchable
            searchPlaceholder="Search all requests..."
            exportable
            filename="all-requests"
            onRowClick={(row) => setSelectedRequest(row)}
          />
        </TabsContent>

        <TabsContent value="mine" className="m-0">
          <EnterpriseDataTable
            title="My Requests"
            data={myRequests}
            columns={columns}
            keyExtractor={(row) => row.id}
            searchable
            searchPlaceholder="Search my requests..."
            exportable
            filename="my-requests"
            onRowClick={(row) => setSelectedRequest(row)}
            emptyState={
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <FileText className="size-12 text-muted-foreground/30" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">No requests yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Your submitted requests will appear here
                  </p>
                </div>
              </div>
            }
          />
        </TabsContent>
      </Tabs>

      {/* Detail Drawer */}
      {selectedRequest && (
        <RequestDetailsDrawer
          request={selectedRequest as unknown as RequestData}
          config={{
            moduleId: selectedRequest.moduleId,
            moduleName: selectedRequest.title,
            moduleIcon: "FileText",
            controlPrefix: "",
            createLabel: "",
            description: `${selectedRequest.moduleId} request`,
          }}
          onClose={() => setSelectedRequest(null)}
          onApprove={() => setShowApprove(true)}
          onReject={() => setShowReject(true)}
          onReturn={() => setShowReturn(true)}
          timeline={selectedRequest.steps.map((s) => ({
            id: s.stepId,
            status: s.name,
            actor: s.actorName || "",
            role: s.name,
            date: s.date || "",
            note: s.note,
            icon: "FileText",
            completed: s.status === "approved",
            current: s.status === "current",
            rejected: s.status === "rejected",
          }))}
          comments={[]}
          attachments={[]}
        />
      )}

      {/* Action Dialogs */}
      <ApproveDialog open={showApprove} onOpenChange={setShowApprove} onConfirm={handleApprove} />
      <RejectDialog open={showReject} onOpenChange={setShowReject} onConfirm={handleReject} />
      <ReturnDialog open={showReturn} onOpenChange={setShowReturn} onConfirm={handleReturn} />
    </div>
  );
}
