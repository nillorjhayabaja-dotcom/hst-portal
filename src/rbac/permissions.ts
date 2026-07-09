import type { Action, ModuleId, PermissionMatrix, RoleId } from "@/types";

// Central Role-Based Access Control matrix.
// Every module is either absent (no access -> 403) or maps to allowed actions.
export const PERMISSIONS: PermissionMatrix = {
  super_admin: {
    dashboard: ["full"],
    notifications: ["full"],
    profile: ["full"],
    employees: ["full"],
    "gate-pass": ["full"],
    leave: ["full"],
    mrf: ["full"],
    visitors: ["full"],
    vehicles: ["full"],
    assets: ["full"],
    "purchase-request": ["full"],
    approvals: ["full"],
    reports: ["full"],
    "audit-logs": ["full"],
    users: ["full"],
    departments: ["full"],
    positions: ["full"],
    workflows: ["full"],
    "workflow-templates": ["full"],
    "control-numbers": ["full"],
    "notification-rules": ["full"],
    "business-rules": ["full"],
    "holiday-calendar": ["full"],
    "company-profile": ["full"],
    delegations: ["full"],
    settings: ["full"],
  },
  admin: {
    dashboard: ["view"],
    notifications: ["view"],
    profile: ["manage"],
    employees: ["manage"],
    "gate-pass": ["manage", "approve"],
    leave: ["manage", "approve"],
    mrf: ["manage", "approve"],
    visitors: ["manage"],
    vehicles: ["manage"],
    assets: ["manage"],
    "purchase-request": ["manage", "approve"],
    approvals: ["approve"],
    reports: ["view"],
    "audit-logs": ["view"],
    users: ["manage"],
    departments: ["manage"],
    positions: ["manage"],
    workflows: ["manage"],
    "workflow-templates": ["manage"],
    "control-numbers": ["manage"],
    "notification-rules": ["manage"],
    "business-rules": ["manage"],
    "holiday-calendar": ["manage"],
    "company-profile": ["manage"],
    delegations: ["manage"],
    settings: ["manage"],
  },
  executive: {
    dashboard: ["view"],
    notifications: ["view"],
    profile: ["view"],
    approvals: ["view"],
    reports: ["view"],
    departments: ["view"],
    employees: ["view"],
    "company-profile": ["view"],
  },
  manager: {
    dashboard: ["view"],
    notifications: ["view"],
    profile: ["manage"],
    employees: ["view"],
    "gate-pass": ["approve"],
    leave: ["approve"],
    mrf: ["approve"],
    "purchase-request": ["approve"],
    approvals: ["approve"],
    reports: ["view"],
  },
  supervisor: {
    dashboard: ["view"],
    notifications: ["view"],
    profile: ["manage"],
    approvals: ["approve"],
    "gate-pass": ["approve"],
    leave: ["approve"],
    mrf: ["approve"],
    employees: ["view"],
  },
  hr: {
    dashboard: ["view"],
    notifications: ["view"],
    profile: ["manage"],
    employees: ["manage"],
    leave: ["manage", "approve"],
    visitors: ["manage"],
    reports: ["view"],
  },
  gad: {
    dashboard: ["view"],
    notifications: ["view"],
    profile: ["manage"],
    "gate-pass": ["approve", "manage"],
    vehicles: ["manage"],
    reports: ["view"],
  },
  security: {
    dashboard: ["view"],
    notifications: ["view"],
    profile: ["view"],
    "gate-pass": ["view"],
    visitors: ["view"],
    vehicles: ["view"],
  },
  employee: {
    dashboard: ["view"],
    notifications: ["view"],
    profile: ["manage"],
    "gate-pass": ["create", "view"],
    leave: ["create", "view"],
    mrf: ["create", "view"],
    visitors: ["create", "view"],
    vehicles: ["view"],
    assets: ["view"],
    "purchase-request": ["create", "view"],
  },
};

export function getActions(role: RoleId, module: ModuleId): Action[] {
  return PERMISSIONS[role]?.[module] ?? [];
}

export function canAccess(role: RoleId, module: ModuleId): boolean {
  return getActions(role, module).length > 0;
}

export function hasAction(role: RoleId, module: ModuleId, action: Action): boolean {
  const actions = getActions(role, module);
  return actions.includes("full") || actions.includes(action);
}

// Whether a role can create new records in a module
export function canCreate(role: RoleId, module: ModuleId): boolean {
  return hasAction(role, module, "create") || hasAction(role, module, "full");
}

export function canApprove(role: RoleId, module: ModuleId): boolean {
  return hasAction(role, module, "approve") || hasAction(role, module, "full");
}
