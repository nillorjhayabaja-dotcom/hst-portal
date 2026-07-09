// Core domain & RBAC types for the HST Enterprise Portal

export type RoleId =
  | "super_admin"
  | "admin"
  | "executive"
  | "manager"
  | "supervisor"
  | "hr"
  | "gad"
  | "security"
  | "employee";

export type ModuleId =
  | "dashboard"
  | "notifications"
  | "profile"
  | "employees"
  | "gate-pass"
  | "leave"
  | "mrf"
  | "visitors"
  | "vehicles"
  | "assets"
  | "purchase-request"
  | "approvals"
  | "reports"
  | "audit-logs"
  | "users"
  | "departments"
  | "workflows"
  | "control-numbers"
  | "settings";

// Granular actions a role may hold on a module
export type Action = "view" | "create" | "approve" | "manage" | "full";

export interface RoleDefinition {
  id: RoleId;
  name: string;
  shortName: string;
  level: number; // 1 = highest authority
  description: string;
  purpose: string;
  accentColor: string; // tailwind token class fragment
  demoUser: {
    name: string;
    email: string;
    title: string;
    department: string;
    avatarInitials: string;
  };
}

// module -> allowed actions
export type PermissionMatrix = Record<RoleId, Partial<Record<ModuleId, Action[]>>>;

export interface NavItem {
  module: ModuleId;
  label: string;
  icon: string; // lucide icon name key
  to: string;
  group: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  title: string;
  department: string;
  role: RoleId;
  avatarInitials: string;
}

export type RequestType = "Gate Pass" | "Leave" | "MRF" | "Purchase Request";

export type RequestStatus =
  | "Draft"
  | "Pending"
  | "In Review"
  | "Approved"
  | "Rejected"
  | "Completed"
  | "Returned";

export interface ApprovalStep {
  role: string;
  status: "done" | "current" | "pending" | "rejected";
  actor?: string;
  date?: string;
  note?: string;
}

export interface RequestItem {
  id: string;
  controlNumber: string;
  type: RequestType;
  title: string;
  requester: string;
  department: string;
  status: RequestStatus;
  priority: "Low" | "Normal" | "High" | "Urgent";
  createdAt: string;
  amount?: string;
  steps: ApprovalStep[];
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  title: string;
  department: string;
  status: "Active" | "On Leave" | "Inactive";
  role: RoleId;
  joined: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "approval" | "system" | "alert" | "info";
  read: boolean;
}
