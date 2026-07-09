// ERP Configuration Platform Service
// Phase 5 — All company configuration engines in one place
import { toast } from "sonner";
import type {
  CompanyProfile,
  Department,
  Position,
  EmployeeExtended,
  ConfigurablePermission,
  NotificationRule,
  DocumentNumberFormat,
  WorkflowTemplate,
  Holiday,
  BusinessRule,
  SystemSetting,
  RoleConfig,
} from "@/types/configuration";
import type { RoleId, ModuleId } from "@/types";
import {
  DEFAULT_COMPANY,
  DEPARTMENTS,
  POSITIONS,
  EMPLOYEES_EXTENDED,
  PERMISSION_MATRIX,
  NOTIFICATION_RULES,
  DOCUMENT_FORMATS,
  WORKFLOW_TEMPLATES,
  HOLIDAYS,
  BUSINESS_RULES,
  SYSTEM_SETTINGS,
  ROLE_CONFIGS,
} from "@/mock/config-data";

// ============================================================
// In-memory state
// ============================================================
let company: CompanyProfile = { ...DEFAULT_COMPANY };
let departments: Department[] = [...DEPARTMENTS];
let positions: Position[] = [...POSITIONS];
let employees: EmployeeExtended[] = [...EMPLOYEES_EXTENDED];
let permissionMatrix: ConfigurablePermission[] = [...PERMISSION_MATRIX];
let notificationRules: NotificationRule[] = [...NOTIFICATION_RULES];
let docFormats: DocumentNumberFormat[] = [...DOCUMENT_FORMATS];
let workflowTemplates: WorkflowTemplate[] = [...WORKFLOW_TEMPLATES];
let holidays: Holiday[] = [...HOLIDAYS];
let businessRules: BusinessRule[] = [...BUSINESS_RULES];
let settings: SystemSetting[] = [...SYSTEM_SETTINGS];
let roleConfigs: RoleConfig[] = [...ROLE_CONFIGS];

// ============================================================
// 1. COMPANY PROFILE
// ============================================================
export function getCompanyProfile(): CompanyProfile {
  return company;
}

export function updateCompanyProfile(updates: Partial<CompanyProfile>): CompanyProfile {
  company = { ...company, ...updates };
  toast.success("Company profile updated");
  return company;
}

// ============================================================
// 2. DEPARTMENTS
// ============================================================
export function getDepartments(): Department[] {
  return departments;
}

export function getDepartmentTree(): Department[] {
  const buildTree = (parentId?: string): Department[] => {
    return departments
      .filter((d) => d.parentId === parentId && d.active)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((d) => ({
        ...d,
        children: buildTree(d.id),
      }));
  };
  return buildTree();
}

export function getDepartment(id: string): Department | undefined {
  return departments.find((d) => d.id === id);
}

export function createDepartment(data: Omit<Department, "id">): Department {
  const dept: Department = {
    ...data,
    id: `dept-${Date.now()}`,
  };
  departments.push(dept);
  toast.success(`Department "${dept.name}" created`);
  return dept;
}

export function updateDepartment(id: string, updates: Partial<Department>): Department | null {
  const dept = departments.find((d) => d.id === id);
  if (!dept) { toast.error("Department not found"); return null; }
  Object.assign(dept, updates);
  toast.success("Department updated");
  return dept;
}

export function deleteDepartment(id: string): boolean {
  const hasChildren = departments.some((d) => d.parentId === id);
  if (hasChildren) { toast.error("Cannot delete: has child departments"); return false; }
  departments = departments.filter((d) => d.id !== id);
  toast.success("Department deleted");
  return true;
}

// ============================================================
// 3. POSITIONS
// ============================================================
export function getPositions(): Position[] {
  return positions;
}

export function getPosition(id: string): Position | undefined {
  return positions.find((p) => p.id === id);
}

export function createPosition(data: Omit<Position, "id">): Position {
  const pos: Position = { ...data, id: `pos-${Date.now()}` };
  positions.push(pos);
  toast.success(`Position "${pos.title}" created`);
  return pos;
}

export function updatePosition(id: string, updates: Partial<Position>): Position | null {
  const pos = positions.find((p) => p.id === id);
  if (!pos) { toast.error("Position not found"); return null; }
  Object.assign(pos, updates);
  toast.success("Position updated");
  return pos;
}

export function deletePosition(id: string): boolean {
  const hasEmployees = employees.some((e) => e.positionId === id);
  if (hasEmployees) { toast.error("Cannot delete: position is assigned to employees"); return false; }
  positions = positions.filter((p) => p.id !== id);
  toast.success("Position deleted");
  return true;
}

export function getPositionsByDepartment(deptId: string): Position[] {
  return positions.filter((p) => p.departmentId === deptId);
}

// ============================================================
// 4. EMPLOYEE MANAGEMENT (extended)
// ============================================================
export function getEmployees(): EmployeeExtended[] {
  return employees;
}

export function getEmployee(id: string): EmployeeExtended | undefined {
  return employees.find((e) => e.id === id);
}

export function createEmployee(data: Omit<EmployeeExtended, "id">): EmployeeExtended {
  const emp: EmployeeExtended = { ...data, id: `EMP-${Date.now()}` };
  employees.push(emp);
  toast.success(`Employee "${emp.name}" created`);
  return emp;
}

export function updateEmployee(id: string, updates: Partial<EmployeeExtended>): EmployeeExtended | null {
  const emp = employees.find((e) => e.id === id);
  if (!emp) { toast.error("Employee not found"); return null; }
  Object.assign(emp, updates);
  toast.success("Employee updated");
  return emp;
}

export function deleteEmployee(id: string): boolean {
  employees = employees.filter((e) => e.id !== id);
  toast.success("Employee deleted");
  return true;
}

// Auto-determine supervisor from position hierarchy
export function getSupervisorForEmployee(employeeId: string): EmployeeExtended | undefined {
  const emp = employees.find((e) => e.id === employeeId);
  if (!emp?.positionId) return undefined;
  const position = positions.find((p) => p.id === emp.positionId);
  if (!position?.reportsToPositionId) return undefined;
  return employees.find((e) => e.positionId === position.reportsToPositionId);
}

export function getEmployeesBySupervisor(supervisorId: string): EmployeeExtended[] {
  return employees.filter((e) => e.supervisorId === supervisorId);
}

// ============================================================
// 5. CONFIGURABLE PERMISSION MATRIX
// ============================================================
export function getPermissionMatrix(): ConfigurablePermission[] {
  return permissionMatrix;
}

export function getPermissionsForRole(roleId: RoleId): ConfigurablePermission[] {
  return permissionMatrix.filter((p) => p.roleId === roleId);
}

export function updatePermission(
  roleId: RoleId,
  moduleId: ModuleId,
  actions: string[],
  scope: "all" | "department" | "own",
): void {
  const existing = permissionMatrix.find((p) => p.roleId === roleId && p.moduleId === moduleId);
  if (existing) {
    existing.actions = actions;
    existing.scope = scope;
  } else {
    permissionMatrix.push({ roleId, moduleId, actions, scope });
  }
  toast.success("Permission updated");
}

export function bulkUpdatePermissions(updates: ConfigurablePermission[]): void {
  updates.forEach((u) => {
    const existing = permissionMatrix.find((p) => p.roleId === u.roleId && p.moduleId === u.moduleId);
    if (existing) {
      existing.actions = u.actions;
      existing.scope = u.scope;
    } else {
      permissionMatrix.push(u);
    }
  });
  toast.success("Permissions updated");
}

// ============================================================
// 6. NOTIFICATION RULES
// ============================================================
export function getNotificationRules(): NotificationRule[] {
  return notificationRules;
}

export function createNotificationRule(data: Omit<NotificationRule, "id">): NotificationRule {
  const rule: NotificationRule = { ...data, id: `nr-${Date.now()}` };
  notificationRules.push(rule);
  toast.success("Notification rule created");
  return rule;
}

export function updateNotificationRule(id: string, updates: Partial<NotificationRule>): NotificationRule | null {
  const rule = notificationRules.find((r) => r.id === id);
  if (!rule) { toast.error("Rule not found"); return null; }
  Object.assign(rule, updates);
  toast.success("Notification rule updated");
  return rule;
}

export function deleteNotificationRule(id: string): boolean {
  notificationRules = notificationRules.filter((r) => r.id !== id);
  toast.success("Notification rule deleted");
  return true;
}

// ============================================================
// 7. DOCUMENT NUMBER FORMAT
// ============================================================
export function getDocumentFormats(): DocumentNumberFormat[] {
  return docFormats;
}

export function updateDocumentFormat(id: string, updates: Partial<DocumentNumberFormat>): DocumentNumberFormat | null {
  const fmt = docFormats.find((f) => f.id === id);
  if (!fmt) { toast.error("Format not found"); return null; }
  Object.assign(fmt, updates);
  toast.success("Document number format updated");
  return fmt;
}

export function resetDocumentSequence(id: string): boolean {
  const fmt = docFormats.find((f) => f.id === id);
  if (!fmt) return false;
  fmt.nextSequence = 0;
  toast.success(`Sequence reset for ${fmt.name}`);
  return true;
}

// ============================================================
// 8. WORKFLOW TEMPLATES
// ============================================================
export function getWorkflowTemplates(): WorkflowTemplate[] {
  return workflowTemplates;
}

export function createWorkflowTemplate(data: Omit<WorkflowTemplate, "id">): WorkflowTemplate {
  const tmpl: WorkflowTemplate = { ...data, id: `wt-${Date.now()}` };
  workflowTemplates.push(tmpl);
  toast.success("Workflow template created");
  return tmpl;
}

export function deleteWorkflowTemplate(id: string): boolean {
  workflowTemplates = workflowTemplates.filter((t) => t.id !== id);
  toast.success("Workflow template deleted");
  return true;
}

// ============================================================
// 9. HOLIDAY CALENDAR
// ============================================================
export function getHolidays(): Holiday[] {
  return holidays;
}

export function createHoliday(data: Omit<Holiday, "id">): Holiday {
  const holiday: Holiday = { ...data, id: `hol-${Date.now()}` };
  holidays.push(holiday);
  toast.success(`Holiday "${holiday.name}" added`);
  return holiday;
}

export function updateHoliday(id: string, updates: Partial<Holiday>): Holiday | null {
  const holiday = holidays.find((h) => h.id === id);
  if (!holiday) { toast.error("Holiday not found"); return null; }
  Object.assign(holiday, updates);
  toast.success("Holiday updated");
  return holiday;
}

export function deleteHoliday(id: string): boolean {
  holidays = holidays.filter((h) => h.id !== id);
  toast.success("Holiday removed");
  return true;
}

export function isBusinessDay(date: string): boolean {
  const d = new Date(date);
  const dayOfWeek = d.getDay(); // 0=Sun
  const isHoliday = holidays.some((h) => h.date === date || (h.recurring && h.date.slice(5) === date.slice(5)));
  return dayOfWeek !== 0 && !isHoliday;
}

// ============================================================
// 10. BUSINESS RULES ENGINE
// ============================================================
export function getBusinessRules(): BusinessRule[] {
  return businessRules;
}

export function createBusinessRule(data: Omit<BusinessRule, "id">): BusinessRule {
  const rule: BusinessRule = { ...data, id: `br-${Date.now()}` };
  businessRules.push(rule);
  toast.success("Business rule created");
  return rule;
}

export function updateBusinessRule(id: string, updates: Partial<BusinessRule>): BusinessRule | null {
  const rule = businessRules.find((r) => r.id === id);
  if (!rule) { toast.error("Rule not found"); return null; }
  Object.assign(rule, updates);
  toast.success("Business rule updated");
  return rule;
}

export function deleteBusinessRule(id: string): boolean {
  businessRules = businessRules.filter((r) => r.id !== id);
  toast.success("Business rule deleted");
  return true;
}

// Evaluate business rules for a given module + metadata
export function evaluateBusinessRules(moduleId: ModuleId, metadata: Record<string, unknown>): BusinessRule[] {
  return businessRules
    .filter((rule) => rule.moduleId === moduleId && rule.active)
    .filter((rule) => {
      return rule.conditions.every((cond) => {
        const value = metadata[cond.field];
        if (value == null) return false;
        switch (cond.operator) {
          case "eq": return value === cond.value;
          case "neq": return value !== cond.value;
          case "gt": return Number(value) > Number(cond.value);
          case "gte": return Number(value) >= Number(cond.value);
          case "lt": return Number(value) < Number(cond.value);
          case "lte": return Number(value) <= Number(cond.value);
          case "contains": return String(value).toLowerCase().includes(String(cond.value).toLowerCase());
          case "in": return (cond.value as string[]).includes(String(value));
          case "between": {
            const [min, max] = (cond.value as string).split(",").map(Number);
            return Number(value) >= min && Number(value) <= max;
          }
          default: return false;
        }
      });
    })
    .sort((a, b) => a.priority - b.priority);
}

// ============================================================
// 11. SYSTEM SETTINGS
// ============================================================
export function getSystemSettings(): SystemSetting[] {
  return settings;
}

export function getSystemSetting(key: string): SystemSetting | undefined {
  return settings.find((s) => s.key === key);
}

export function updateSystemSetting(key: string, value: string): SystemSetting | null {
  const setting = settings.find((s) => s.key === key);
  if (!setting) { toast.error("Setting not found"); return null; }
  setting.value = value;
  toast.success("Setting updated");
  return setting;
}

export function getSystemSettingsByCategory(category: string): SystemSetting[] {
  return settings.filter((s) => s.category === category);
}

// ============================================================
// 12. ROLE CONFIGURATION
// ============================================================
export function getRoleConfigs(): RoleConfig[] {
  return roleConfigs;
}

export function updateRoleConfig(id: RoleId, updates: Partial<RoleConfig>): RoleConfig | null {
  const role = roleConfigs.find((r) => r.id === id);
  if (!role) { toast.error("Role not found"); return null; }
  Object.assign(role, updates);
  toast.success("Role configuration updated");
  return role;
}

// ============================================================
// ORG CHART — Build full hierarchy
// ============================================================
export function getOrgChart(): {
  departments: Department[];
  positions: Position[];
  employees: EmployeeExtended[];
} {
  return {
    departments: getDepartmentTree(),
    positions,
    employees,
  };
}

// ============================================================
// Reset to defaults
// ============================================================
export function resetConfiguration(): void {
  company = { ...DEFAULT_COMPANY };
  departments = [...DEPARTMENTS];
  positions = [...POSITIONS];
  employees = [...EMPLOYEES_EXTENDED];
  permissionMatrix = [...PERMISSION_MATRIX];
  notificationRules = [...NOTIFICATION_RULES];
  docFormats = [...DOCUMENT_FORMATS];
  workflowTemplates = [...WORKFLOW_TEMPLATES];
  holidays = [...HOLIDAYS];
  businessRules = [...BUSINESS_RULES];
  settings = [...SYSTEM_SETTINGS];
  roleConfigs = [...ROLE_CONFIGS];
  toast.success("Configuration reset to defaults");
}