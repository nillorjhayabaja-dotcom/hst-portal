import type { ModuleId, NavItem, RoleId } from "@/types";
import { canAccess } from "@/rbac/permissions";

// Master module registry. Route target: dashboard/notifications/profile are
// explicit routes; the rest render through the generic /app/m/$moduleId route.
export const MODULES: Record<ModuleId, { label: string; icon: string; group: string; to: string }> = {
  dashboard: { label: "Dashboard", icon: "LayoutDashboard", group: "Overview", to: "/app/dashboard" },
  notifications: { label: "Notifications", icon: "Bell", group: "Overview", to: "/app/notifications" },
  approvals: { label: "Approvals", icon: "CheckCircle2", group: "Overview", to: "/app/m/approvals" },

  "gate-pass": { label: "Gate Pass", icon: "DoorOpen", group: "Operations", to: "/app/m/gate-pass" },
  leave: { label: "Leave", icon: "CalendarDays", group: "Operations", to: "/app/m/leave" },
  mrf: { label: "MRF", icon: "ClipboardList", group: "Operations", to: "/app/m/mrf" },
  visitors: { label: "Visitors", icon: "UserCheck", group: "Operations", to: "/app/m/visitors" },
  vehicles: { label: "Vehicles", icon: "Car", group: "Operations", to: "/app/m/vehicles" },
  assets: { label: "Assets", icon: "Package", group: "Operations", to: "/app/m/assets" },
  "purchase-request": { label: "Purchase Request", icon: "ShoppingCart", group: "Operations", to: "/app/m/purchase-request" },

  employees: { label: "Employees", icon: "Users", group: "Management", to: "/app/m/employees" },
  departments: { label: "Departments", icon: "Building2", group: "Management", to: "/app/m/departments" },
  reports: { label: "Reports", icon: "BarChart3", group: "Management", to: "/app/m/reports" },
  "audit-logs": { label: "Audit Logs", icon: "ScrollText", group: "Management", to: "/app/m/audit-logs" },

  users: { label: "Users & Roles", icon: "ShieldCheck", group: "Administration", to: "/app/m/users" },
  workflows: { label: "Workflows", icon: "GitBranch", group: "Administration", to: "/app/m/workflows" },
  "control-numbers": { label: "Control Numbers", icon: "Hash", group: "Administration", to: "/app/m/control-numbers" },
  settings: { label: "Settings", icon: "Settings", group: "Administration", to: "/app/m/settings" },

  profile: { label: "My Profile", icon: "User", group: "Account", to: "/app/profile" },
};

export const GROUP_ORDER = ["Overview", "Operations", "Management", "Administration", "Account"];

const MODULE_ORDER: ModuleId[] = [
  "dashboard",
  "notifications",
  "approvals",
  "gate-pass",
  "leave",
  "mrf",
  "visitors",
  "vehicles",
  "assets",
  "purchase-request",
  "employees",
  "departments",
  "reports",
  "audit-logs",
  "users",
  "workflows",
  "control-numbers",
  "settings",
  "profile",
];

export function getNavForRole(role: RoleId): NavItem[] {
  return MODULE_ORDER.filter((m) => canAccess(role, m)).map((m) => ({
    module: m,
    label: MODULES[m].label,
    icon: MODULES[m].icon,
    to: MODULES[m].to,
    group: MODULES[m].group,
  }));
}

export function getGroupedNav(role: RoleId): { group: string; items: NavItem[] }[] {
  const nav = getNavForRole(role);
  return GROUP_ORDER.map((group) => ({
    group,
    items: nav.filter((n) => n.group === group),
  })).filter((g) => g.items.length > 0);
}
