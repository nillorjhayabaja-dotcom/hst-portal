// Request Framework - Reusable request list, details, and wizard for every module
import { useState, type ReactNode } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { EnterpriseDataTable, type Column } from "@/components/enterprise/EnterpriseDataTable";
import { StatusBadgeEnhanced } from "@/components/enterprise/StatusBadgeEnhanced";
import { UniversalDrawer, type DrawerTab } from "@/components/enterprise/UniversalDrawer";
import { UniversalTimeline } from "@/components/enterprise/UniversalTimeline";
import { CommentSection } from "@/components/enterprise/CommentSection";
import { AttachmentSection } from "@/components/enterprise/AttachmentSection";
import { QuickActionCards } from "@/components/enterprise/QuickActionCards";
import { UniversalKpiCard } from "@/components/enterprise/UniversalKpiCard";
import { NoRequests } from "@/components/enterprise/EmptyStates";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  FileText,
  Clock,
  User,
  Building2,
  Hash,
  ArrowUpRight,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommentItem, AttachmentItem } from "@/types/enterprise";
import {
  getEmployeeDisplayName,
  getDepartmentName,
  displayValue,
} from "@/utils/display";

// ============================================================
// Types
// ============================================================
export interface RequestData {
  id: string;
  controlNumber: string;
  type: string;
  title: string;
  requester?: {
    id: string;
    displayName: string;
    email: string;
    firstName?: string;
    lastName?: string;
    employeeNumber?: string;
    department?: {
      id: string;
      name: string;
      code: string;
    };
    position?: {
      title: string;
    };
  };
  department?: {
    id: string;
    name: string;
    code: string;
  };
  status: string;
  priority: string;
  createdAt: string;
  [key: string]: unknown;
}

export interface ModuleConfig {
  moduleId: string;
  moduleName: string;
  moduleIcon: string;
  controlPrefix: string;
  createLabel: string;
  description: string;
}

// ============================================================
// Request List Page
// ============================================================
interface RequestListPageProps {
  config: ModuleConfig;
  data: RequestData[];
  columns: Column<RequestData>[];
  onRowClick?: (row: RequestData) => void;
  onCreateNew?: () => void;
  onViewDetails?: (row: RequestData) => void;
  loading?: boolean;
  kpiCards?: ReactNode;
  quickActions?: ReactNode;
  searchPlaceholder?: string;
  filename?: string;
}

export function RequestListPage({
  config,
  data,
  columns,
  onRowClick,
  onCreateNew,
  loading = false,
  kpiCards,
  quickActions,
  searchPlaceholder,
  filename,
}: RequestListPageProps) {
  const defaultColumns: Column<RequestData>[] = [
    {
      id: "controlNumber",
      header: "Control No.",
      accessorKey: "controlNumber",
      sortable: true,
      width: "160px",
    },
    { id: "title", header: "Title", accessorKey: "title", sortable: true, filterable: true },
    {
      id: "requester",
      header: "Requester",
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
      cell: (value) => <StatusBadgeEnhanced status={String(value)} />,
    },
    {
      id: "priority",
      header: "Priority",
      accessorKey: "priority",
      sortable: true,
      width: "100px",
      cell: (value) => <StatusBadgeEnhanced status={String(value)} />,
    },
    {
      id: "createdAt",
      header: "Date Created",
      accessorKey: "createdAt",
      sortable: true,
      width: "130px",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={config.moduleName}
        description={config.description}
        crumbs={[{ label: "Dashboard", to: "/app/dashboard" }, { label: config.moduleName }]}
        actions={
          onCreateNew ? (
            <Button onClick={onCreateNew} className="gap-2">
              <Plus className="size-4" />
              {config.createLabel}
            </Button>
          ) : undefined
        }
      />

      {kpiCards && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{kpiCards}</div>
      )}

      {quickActions && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h3>
          {quickActions}
        </div>
      )}

      <EnterpriseDataTable<RequestData>
        title={`${config.moduleName} List`}
        data={data}
        columns={columns.length > 0 ? columns : defaultColumns}
        keyExtractor={(row) => row.id}
        loading={loading}
        searchable
        searchPlaceholder={searchPlaceholder ?? `Search ${config.moduleName.toLowerCase()}...`}
        exportable
        filename={filename ?? `${config.moduleId}-list`}
        onRowClick={onRowClick}
        selectable
        bulkActions={[
          {
            label: "Export Selected",
            action: (ids) => console.log("Export", ids),
            variant: "outline",
          },
        ]}
        emptyState={<NoRequests />}
      />
    </div>
  );
}

// ============================================================
// Request Details View
// ============================================================
interface RequestDetailsProps {
  request: RequestData;
  config: ModuleConfig;
  onClose: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onReturn?: () => void;
  timeline: {
    id: string;
    status: string;
    actor: string;
    role: string;
    date: string;
    note?: string;
    icon: string;
    completed: boolean;
    current: boolean;
    rejected: boolean;
  }[];
  comments: CommentItem[];
  attachments: AttachmentItem[];
}

export function RequestDetailsDrawer({
  request,
  config,
  onClose,
  onApprove,
  onReject,
  onReturn,
  timeline,
  comments,
  attachments,
}: RequestDetailsProps) {
  const tabs: DrawerTab[] = [
    {
      id: "overview",
      label: "Overview",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <DetailField icon={Hash} label="Control Number" value={request.controlNumber} />
            <DetailField icon={FileText} label="Type" value={request.type} />
            <DetailField icon={User} label="Requester" value={getEmployeeDisplayName(request.requester)} />
            <DetailField icon={Building2} label="Department" value={getDepartmentName(request.department)} />
            <DetailField icon={CalendarDays} label="Date Created" value={request.createdAt} />
            <DetailField icon={Clock} label="Priority" value={request.priority} />
          </div>
          <Separator />
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">Status</h4>
            <StatusBadgeEnhanced status={request.status} size="md" />
          </div>
          <Separator />
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">Title</h4>
            <p className="text-sm text-muted-foreground">{request.title}</p>
          </div>
          {onApprove && onReject && onReturn && (
            <>
              <Separator />
              <div className="flex gap-2">
                <Button onClick={onReturn} variant="outline" className="flex-1">
                  Return
                </Button>
                <Button onClick={onReject} variant="destructive" className="flex-1">
                  Reject
                </Button>
                <Button
                  onClick={onApprove}
                  className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
                >
                  Approve
                </Button>
              </div>
            </>
          )}
        </div>
      ),
    },
    {
      id: "timeline",
      label: "Timeline",
      badge: timeline.filter((e) => e.current).length,
      content: <UniversalTimeline events={timeline} />,
    },
    {
      id: "comments",
      label: "Comments",
      badge: comments.length,
      content: <CommentSection comments={comments} />,
    },
    {
      id: "attachments",
      label: "Attachments",
      badge: attachments.length,
      content: <AttachmentSection attachments={attachments} readonly />,
    },
  ];

  return (
    <UniversalDrawer
      open={!!request}
      onClose={onClose}
      title={request.controlNumber}
      description={request.title}
      tabs={tabs}
    />
  );
}

function DetailField({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3" />
        {label}
      </div>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
