import { createFileRoute, useParams } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { MODULES } from "@/navigation/nav";
import { canAccess } from "@/rbac/permissions";
import { ROLES, ROLE_ORDER } from "@/rbac/roles";
import { PERMISSIONS } from "@/rbac/permissions";
import type { ModuleId } from "@/types";
import { PageHeader } from "@/components/app/PageHeader";
import { AccessDenied } from "@/components/app/AccessDenied";
import { EnterpriseDataTable, type Column } from "@/components/enterprise/EnterpriseDataTable";
import { StatusBadgeEnhanced } from "@/components/enterprise/StatusBadgeEnhanced";
import { GatePassModule } from "@/features/modules/GatePassModule";
import { LeaveModule } from "@/features/modules/LeaveModule";
import { MRFModule } from "@/features/modules/MRFModule";
import { PRModule } from "@/features/modules/PRModule";
import { ApprovalInbox } from "@/components/enterprise/ApprovalInbox";
import { DelegationManager } from "@/components/enterprise/DelegationManager";
import { WorkflowBuilder } from "@/components/enterprise/WorkflowBuilder";
import { CompanyProfileEditor } from "@/components/enterprise/CompanyProfileEditor";
import { HolidayCalendar } from "@/components/enterprise/HolidayCalendar";
import { NotificationRulesManager } from "@/components/enterprise/NotificationRulesManager";
import { BusinessRulesEngine } from "@/components/enterprise/BusinessRulesEngine";
import { TrendChart, RequestPie, DeptBar, PieLegend } from "@/features/dashboards/charts";
import { ApprovalStepper } from "@/components/app/ApprovalStepper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Check,
  Minus,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { getApprovalMetrics } from "@/services/approval-engine";
import type { ApprovalMetrics } from "@/types/approval";
import { useEmployees } from "@/services/employee-hooks";
import { useDepartments } from "@/services/config-hooks";

export const Route = createFileRoute("/app/m/$moduleId")({
  component: ModuleRoute,
});

function ModuleRoute() {
  const { moduleId } = useParams({ from: "/app/m/$moduleId" });
  const { user } = useAuth();
  if (!user) return null;

  const module = moduleId as ModuleId;
  const meta = MODULES[module];

  if (!meta) return <AccessDenied module={moduleId} />;
  if (!canAccess(user.role, module)) return <AccessDenied module={meta.label} />;

  return (
    <>
      <PageHeader
        title={meta.label}
        description={descriptions[module] ?? "Module workspace"}
        crumbs={[
          { label: "Home", to: "/app/dashboard" },
          { label: meta.group },
          { label: meta.label },
        ]}
      />
      <ModuleContent module={module} role={user.role} label={meta.label} />
    </>
  );
}

const descriptions: Partial<Record<ModuleId, string>> = {
  "gate-pass": "Create, route and release gate passes",
  leave: "Request and approve employee leave",
  mrf: "Manpower requisition forms",
  "purchase-request": "Procurement requests and approvals",
  approvals: "Requests awaiting your action",
  employees: "Company-wide employee directory",
  departments: "Departments and organization structure",
  reports: "Analytics and operational reports",
  "audit-logs": "System activity audit trail",
  "company-profile": "Company profile and organizational settings",
  users: "Role-based access control matrix",
  "workflow-templates": "Reusable workflow template library",
  "notification-rules": "Configurable notification rules engine",
  "business-rules": "IF-THEN business rules engine",
  "holiday-calendar": "Company holiday calendar and events",
  positions: "Job position management",
  visitors: "Visitor management and verification",
  vehicles: "Company vehicle fleet and assignments",
  assets: "Asset registry and assignments",
  workflows: "Approval workflow configuration",
  "control-numbers": "Document control number series",
  settings: "System preferences",
};

function ModuleContent({
  module,
  role,
  label,
}: {
  module: ModuleId;
  role: import("@/types").RoleId;
  label: string;
}) {
  if (module === "gate-pass") return <GatePassModule />;
  if (module === "leave") return <LeaveModule />;
  if (module === "mrf") return <MRFModule />;
  if (module === "purchase-request") return <PRModule />;
  if (module === "approvals") return <ApprovalInbox />;

  switch (module) {
    case "employees": {
      const { data: empData, isLoading } = useEmployees();
      const empRows = empData?.data || [];
      const cols: Column[] = [
        { id: "employeeNumber", header: "ID", accessorKey: "employeeNumber", sortable: true, width: "120px", cell: (val) => <span className="font-mono text-xs">{String(val)}</span> },
        { id: "firstName", header: "First Name", accessorKey: "firstName", sortable: true, filterable: true, cell: (val) => <span className="font-medium">{String(val)}</span> },
        { id: "lastName", header: "Last Name", accessorKey: "lastName", sortable: true, cell: (val) => <span className="font-medium">{String(val)}</span> },
        { id: "title", header: "Title", accessorKey: "title", sortable: true },
        { id: "departmentName", header: "Department", accessorKey: "departmentName", sortable: true },
        { id: "status", header: "Status", accessorKey: "status", sortable: true, width: "120px", cell: (val) => <StatusBadgeEnhanced status={String(val)} /> },
      ];
      return (
        <EnterpriseDataTable title="Employee Directory" data={empRows} columns={cols} keyExtractor={(row: any) => row.id} searchable searchPlaceholder="Search employees..." exportable filename="employees" loading={isLoading} />
      );
    }
    case "departments": {
      const { data: deptData, isLoading } = useDepartments();
      const deptRows = deptData || [];
      if (isLoading) return <div className="text-sm text-muted-foreground p-8">Loading departments...</div>;
      return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {deptRows.map((d: any) => (
            <Card key={d.id} className="shadow-card">
              <CardHeader className="pb-2"><CardTitle className="text-base">{d.name}</CardTitle></CardHeader>
              <CardContent className="space-y-1.5 text-sm">
                <p className="text-muted-foreground">Code: <span className="text-foreground">{d.code}</span></p>
                <p className="text-muted-foreground">Level: <span className="text-foreground">{d.level}</span></p>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }
    case "visitors":
      return <EnterpriseDataTable title="Visitor Management" data={[]} columns={[{ id: "name", header: "Name", accessorKey: "name" }]} keyExtractor={(row: any) => row.id} filename="visitors" />;
    case "vehicles":
      return <EnterpriseDataTable title="Vehicle Fleet" data={[]} columns={[{ id: "plateNumber", header: "Plate No.", accessorKey: "plateNumber" }]} keyExtractor={(row: any) => row.id} filename="vehicles" />;
    case "assets":
      return <EnterpriseDataTable title="Asset Registry" data={[]} columns={[{ id: "assetTag", header: "Asset ID", accessorKey: "assetTag" }, { id: "name", header: "Name", accessorKey: "name" }]} keyExtractor={(row: any) => row.id} filename="assets" />;
    case "audit-logs":
      return <EnterpriseDataTable title="Audit Trail" data={[]} columns={[{ id: "createdAt", header: "Timestamp", accessorKey: "createdAt" }, { id: "actorName", header: "Actor", accessorKey: "actorName" }, { id: "action", header: "Action", accessorKey: "action" }]} keyExtractor={(row: any) => row.id} filename="audit-logs" />;
    case "reports":
      return (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2"><TrendChart /></div>
            <div className="space-y-4"><RequestPie /><PieLegend /></div>
          </div>
          <DeptBar />
        </div>
      );
    case "users": return <RbacMatrix />;
    case "workflows":
    case "workflow-templates": return <WorkflowBuilder />;
    case "company-profile": return <CompanyProfileEditor />;
    case "holiday-calendar": return <HolidayCalendar />;
    case "notification-rules": return <NotificationRulesManager />;
    case "business-rules": return <BusinessRulesEngine />;
    case "delegations": return <DelegationManager />;
    case "control-numbers": return <ControlNumbers />;
    case "settings": return <SettingsView />;
    default: return null;
  }
}

function RbacMatrix() {
  const modules = Object.keys(MODULES) as ModuleId[];
  return (
    <Card className="shadow-card">
      <CardHeader><CardTitle className="text-base">Role-Based Access Matrix</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 bg-card p-2 text-left font-semibold">Module</th>
                {ROLE_ORDER.map((r) => (
                  <th key={r} className="p-2 text-center text-xs font-semibold">{ROLES[r].shortName}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modules.map((m) => (
                <tr key={m} className="border-t border-border">
                  <td className="sticky left-0 bg-card p-2 font-medium">{MODULES[m].label}</td>
                  {ROLE_ORDER.map((r) => {
                    const has = !!PERMISSIONS[r]?.[m]?.length;
                    return (
                      <td key={r} className="p-2 text-center">
                        {has ? <Check className="mx-auto size-4 text-success" /> : <Minus className="mx-auto size-4 text-muted-foreground/40" />}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function ControlNumbers() {
  const series = [
    { prefix: "GP-2026", label: "Gate Pass", current: 482, format: "GP-YYYY-000000" },
    { prefix: "LV-2026", label: "Leave", current: 1204, format: "LV-YYYY-000000" },
    { prefix: "MRF-2026", label: "MRF", current: 318, format: "MRF-YYYY-000000" },
    { prefix: "PR-2026", label: "Purchase Request", current: 921, format: "PR-YYYY-000000" },
  ];
  const cols: Column[] = [
    { id: "prefix", header: "Series", accessorKey: "prefix", sortable: true, width: "140px", cell: (val) => <span className="font-mono text-xs font-medium">{String(val)}</span> },
    { id: "label", header: "Document", accessorKey: "label", sortable: true },
    { id: "format", header: "Format", accessorKey: "format", sortable: true, cell: (val) => <span className="font-mono text-xs">{String(val)}</span> },
    { id: "current", header: "Current No.", accessorKey: "current", sortable: true, cell: (val) => <span className="font-semibold">{String(val)}</span> },
  ];
  return <EnterpriseDataTable title="Control Number Series" data={series} columns={cols} keyExtractor={(row: any) => row.prefix} filename="control-numbers" />;
}

function SettingsView() {
  const options = [
    { label: "Email notifications", desc: "Receive approval alerts by email", on: true },
    { label: "Two-factor authentication", desc: "Require 2FA on sign in", on: false },
    { label: "Auto-route approvals", desc: "Automatically route to next approver", on: true },
    { label: "Weekly digest", desc: "Summary of department activity", on: false },
  ];
  return (
    <Card className="max-w-2xl shadow-card">
      <CardHeader><CardTitle className="text-base">System Preferences</CardTitle></CardHeader>
      <CardContent className="space-y-1">
        {options.map((o) => (
          <div key={o.label} className="flex items-center justify-between gap-4 border-b border-border py-3.5 last:border-0">
            <div>
              <p className="text-sm font-medium text-foreground">{o.label}</p>
              <p className="text-xs text-muted-foreground">{o.desc}</p>
            </div>
            <Switch defaultChecked={o.on} onCheckedChange={() => toast.success("Preference updated")} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}