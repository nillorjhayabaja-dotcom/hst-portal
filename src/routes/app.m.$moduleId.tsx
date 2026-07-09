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
import { DataTable, type Column } from "@/components/app/DataTable";
import { StatusBadge } from "@/components/app/StatusBadge";
import { RequestsModule } from "@/features/modules/RequestsModule";
import { TrendChart, RequestPie, DeptBar, PieLegend } from "@/features/dashboards/charts";
import { ApprovalStepper } from "@/components/app/ApprovalStepper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Check, Minus } from "lucide-react";
import {
  EMPLOYEES,
  DEPARTMENTS,
  VISITORS,
  VEHICLES,
  ASSETS,
  AUDIT_LOGS,
} from "@/mock/data";

export const Route = createFileRoute("/app/m/$moduleId")({
  component: ModuleRoute,
});

const REQUEST_MODULES: ModuleId[] = ["gate-pass", "leave", "mrf", "purchase-request", "approvals"];

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
        crumbs={[{ label: "Home", to: "/app/dashboard" }, { label: meta.group }, { label: meta.label }]}
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
  users: "Role-based access control matrix",
  visitors: "Visitor management and verification",
  vehicles: "Company vehicle fleet and assignments",
  assets: "Asset registry and assignments",
  workflows: "Approval workflow configuration",
  "control-numbers": "Document control number series",
  settings: "System preferences",
};

function ModuleContent({ module, role, label }: { module: ModuleId; role: ReturnType<typeof useAuth>["user"] extends null ? never : any; label: string }) {
  if (REQUEST_MODULES.includes(module)) {
    return <RequestsModule module={module} role={role} label={label} />;
  }

  switch (module) {
    case "employees": {
      const cols: Column<(typeof EMPLOYEES)[number]>[] = [
        { key: "id", header: "ID", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
        { key: "name", header: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
        { key: "title", header: "Title" },
        { key: "department", header: "Department" },
        { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
      ];
      return <DataTable columns={cols} data={EMPLOYEES} searchKeys={["name", "title", "department", "id"]} />;
    }
    case "departments":
      return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DEPARTMENTS.map((d) => (
            <Card key={d.id} className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{d.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 text-sm">
                <p className="text-muted-foreground">Head: <span className="text-foreground">{d.head}</span></p>
                <div className="flex justify-between pt-2">
                  <span className="text-muted-foreground">Employees</span>
                  <span className="font-semibold text-foreground">{d.employees}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Open requests</span>
                  <span className="font-semibold text-foreground">{d.requests}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    case "visitors": {
      const cols: Column<(typeof VISITORS)[number]>[] = [
        { key: "id", header: "ID", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
        { key: "name", header: "Visitor", render: (r) => <span className="font-medium">{r.name}</span> },
        { key: "company", header: "Company" },
        { key: "host", header: "Host" },
        { key: "purpose", header: "Purpose" },
        { key: "time", header: "Time" },
        { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
      ];
      return <DataTable columns={cols} data={VISITORS} searchKeys={["name", "company", "host"]} />;
    }
    case "vehicles": {
      const cols: Column<(typeof VEHICLES)[number]>[] = [
        { key: "plate", header: "Plate", render: (r) => <span className="font-mono text-xs font-medium">{r.plate}</span> },
        { key: "type", header: "Type" },
        { key: "assignedTo", header: "Assigned To" },
        { key: "location", header: "Location" },
        { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
      ];
      return <DataTable columns={cols} data={VEHICLES} searchKeys={["plate", "type", "assignedTo"]} />;
    }
    case "assets": {
      const cols: Column<(typeof ASSETS)[number]>[] = [
        { key: "id", header: "Asset ID", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
        { key: "name", header: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
        { key: "category", header: "Category" },
        { key: "assignedTo", header: "Assigned To" },
        { key: "value", header: "Value" },
        { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
      ];
      return <DataTable columns={cols} data={ASSETS} searchKeys={["name", "category", "assignedTo"]} />;
    }
    case "audit-logs": {
      const cols: Column<(typeof AUDIT_LOGS)[number]>[] = [
        { key: "time", header: "Timestamp", render: (r) => <span className="font-mono text-xs">{r.time}</span> },
        { key: "actor", header: "Actor", render: (r) => <span className="font-medium">{r.actor}</span> },
        { key: "action", header: "Action" },
        { key: "target", header: "Target" },
      ];
      return <DataTable columns={cols} data={AUDIT_LOGS} searchKeys={["actor", "action", "target"]} />;
    }
    case "reports":
      return (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2"><TrendChart title="Requests vs Approvals" /></div>
            <div className="space-y-4"><RequestPie /><PieLegend /></div>
          </div>
          <DeptBar />
        </div>
      );
    case "users":
      return <RbacMatrix />;
    case "workflows":
      return <WorkflowsView />;
    case "control-numbers":
      return <ControlNumbers />;
    case "settings":
      return <SettingsView />;
    default:
      return null;
  }
}

function RbacMatrix() {
  const modules = Object.keys(MODULES) as ModuleId[];
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-base">Role-Based Access Matrix</CardTitle>
        <p className="text-sm text-muted-foreground">Module access per role across the organization.</p>
      </CardHeader>
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
                    const has = !!PERMISSIONS[r][m]?.length;
                    return (
                      <td key={r} className="p-2 text-center">
                        {has ? (
                          <Check className="mx-auto size-4 text-success" />
                        ) : (
                          <Minus className="mx-auto size-4 text-muted-foreground/40" />
                        )}
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

const FLOWS = [
  { name: "Gate Pass", steps: ["Employee", "Supervisor", "Department Manager", "General Administration", "Security", "Completed"] },
  { name: "Leave", steps: ["Employee", "Supervisor", "Manager", "HR", "Completed"] },
  { name: "MRF", steps: ["Employee", "Supervisor", "Manager", "Approver", "Completed"] },
  { name: "Purchase Request", steps: ["Employee", "Manager", "Purchasing", "Finance", "Completed"] },
];

function WorkflowsView() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {FLOWS.map((f) => (
        <Card key={f.name} className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{f.name} Workflow</CardTitle>
          </CardHeader>
          <CardContent>
            <ApprovalStepper
              steps={f.steps.map((s, i) => ({
                role: s,
                status: i === 0 ? "done" : i === f.steps.length - 1 ? "pending" : "pending",
              }))}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ControlNumbers() {
  const series = [
    { prefix: "GP-2026", label: "Gate Pass", current: 482, format: "GP-YYYY-000000" },
    { prefix: "LV-2026", label: "Leave", current: 1204, format: "LV-YYYY-000000" },
    { prefix: "MRF-2026", label: "MRF", current: 318, format: "MRF-YYYY-000000" },
    { prefix: "PR-2026", label: "Purchase Request", current: 921, format: "PR-YYYY-000000" },
  ];
  const cols: Column<(typeof series)[number]>[] = [
    { key: "prefix", header: "Series", render: (r) => <span className="font-mono text-xs font-medium">{r.prefix}</span> },
    { key: "label", header: "Document" },
    { key: "format", header: "Format", render: (r) => <span className="font-mono text-xs">{r.format}</span> },
    { key: "current", header: "Current No.", render: (r) => <span className="font-semibold">{r.current}</span> },
  ];
  return <DataTable columns={cols} data={series} />;
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
      <CardHeader>
        <CardTitle className="text-base">System Preferences</CardTitle>
      </CardHeader>
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
