// ERP Configuration Platform Types
// Phase 5 — Reusable configuration engines for the entire ERP
import type { RoleId, ModuleId } from "@/types";

// ============================================================
// 1. Company Profile
// ============================================================
export interface CompanyProfile {
  id: string;
  name: string;
  legalName: string;
  logo?: string;
  address: string;
  tin: string;
  contactNumber: string;
  email: string;
  website: string;
  defaultTimezone: string;
  businessHoursStart: string; // "08:00"
  businessHoursEnd: string;   // "17:00"
  workingDays: number[];      // [1,2,3,4,5] Mon-Fri
  fiscalYearStart: string;    // "01-01"
  currency: string;
  currencySymbol: string;
  language: string;
  dateFormat: string;
  timeFormat: string;
}

// ============================================================
// 2. Organizational Structure
// ============================================================
export interface Department {
  id: string;
  name: string;
  code: string;
  parentId?: string;
  headId?: string;
  headName?: string;
  description?: string;
  level: number;
  sortOrder: number;
  active: boolean;
  children?: Department[];
}

// ============================================================
// 3. Position Management
// ============================================================
export interface Position {
  id: string;
  title: string;
  code: string;
  departmentId: string;
  departmentName: string;
  defaultRole: RoleId;
  reportsToPositionId?: string;
  reportsToTitle?: string;
  level: number;
  approvalAuthority: boolean;
  maxApprovalAmount?: number;
  jobDescription?: string;
  active: boolean;
}

export interface EmployeePosition {
  employeeId: string;
  employeeName: string;
  positionId: string;
  positionTitle: string;
  departmentId: string;
  departmentName: string;
  startDate: string;
  endDate?: string;
  isPrimary: boolean;
}

export interface EmployeeExtended {
  id: string;
  name: string;
  email: string;
  title: string;
  departmentId: string;
  departmentName: string;
  status: "Active" | "On Leave" | "Inactive";
  role: RoleId;
  positionId?: string;
  positionTitle?: string;
  supervisorId?: string;
  supervisorName?: string;
  joined: string;
  phone?: string;
  avatar?: string;
}

// ============================================================
// 4. Permission Matrix (configurable)
// ============================================================
export interface ConfigurablePermission {
  roleId: RoleId;
  moduleId: ModuleId;
  actions: string[]; // "create", "view", "edit", "delete", "approve", "export", "full"
  scope: "all" | "department" | "own";
}

export interface RoleConfig {
  id: RoleId;
  name: string;
  shortName: string;
  level: number;
  description: string;
  active: boolean;
}

// ============================================================
// 5. Notification Rules (configurable)
// ============================================================
export interface NotificationRule {
  id: string;
  moduleId: ModuleId;
  event: string; // "submitted", "approved", "rejected", "returned", "escalated", "reminder"
  notifyRoles: RoleId[];
  notifyUsers: string[];
  channels: ("in_app" | "email" | "sms")[];
  templateSubject: string;
  templateBody: string;
  active: boolean;
}

// ============================================================
// 6. Document Number Generator (configurable)
// ============================================================
export interface DocumentNumberFormat {
  id: string;
  moduleId: ModuleId;
  name: string;
  prefix: string;
  separator: string;
  includeYear: boolean;
  includeMonth: boolean;
  includeDepartment: boolean;
  sequenceLength: number;
  format: string; // pattern like "{PREFIX}{SEP}{YEAR}{SEP}{SEQ}"
  nextSequence: number;
  active: boolean;
}

// ============================================================
// 7. Workflow Templates
// ============================================================
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  defaultSteps: string[]; // Role IDs in order
  active: boolean;
}

// ============================================================
// 8. Holiday Calendar
// ============================================================
export interface Holiday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  type: "regular" | "special_non_working" | "special_working" | "company_event";
  recurring: boolean;
  departmentId?: string;
  description?: string;
}

// ============================================================
// 9. Business Rules
// ============================================================
export type RuleOperator = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains" | "in" | "between";

export interface BusinessRuleCondition {
  field: string;
  operator: RuleOperator;
  value: string | number | string[];
}

export interface BusinessRuleAction {
  type: "insert_step" | "skip_step" | "change_approver" | "notify" | "set_priority" | "require_attachment";
  target: string;
  value: string;
}

export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  moduleId: ModuleId;
  priority: number;
  conditions: BusinessRuleCondition[];
  actions: BusinessRuleAction[];
  active: boolean;
}

// ============================================================
// 10. System Settings (key-value)
// ============================================================
export interface SystemSetting {
  key: string;
  value: string;
  category: string;
  description: string;
  type: "text" | "number" | "boolean" | "select" | "json";
  options?: string[];
}