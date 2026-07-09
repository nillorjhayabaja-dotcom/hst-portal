// ERP Configuration Platform Mock Data
// Phase 5 — Complete enterprise configuration dataset
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

// ============================================================
// 1. COMPANY PROFILE
// ============================================================
export const DEFAULT_COMPANY: CompanyProfile = {
  id: "comp-1",
  name: "HST Technologies",
  legalName: "HST Technologies Corporation",
  logo: "",
  address: "Lot 12, Phase 3, MEPZ II, Lapu-Lapu City, Cebu 6015",
  tin: "123-456-789-000",
  contactNumber: "+63 (32) 234-5678",
  email: "info@hst-corp.com",
  website: "www.hst-corp.com",
  defaultTimezone: "Asia/Manila",
  businessHoursStart: "08:00",
  businessHoursEnd: "17:00",
  workingDays: [1, 2, 3, 4, 5],
  fiscalYearStart: "01-01",
  currency: "PHP",
  currencySymbol: "₱",
  language: "en",
  dateFormat: "YYYY-MM-DD",
  timeFormat: "HH:mm",
};

// ============================================================
// 2. ORGANIZATIONAL STRUCTURE
// ============================================================
export const DEPARTMENTS: Department[] = [
  { id: "dept-exec", name: "Executive Office", code: "EXEC", level: 1, sortOrder: 1, active: true, headName: "Robert Tan" },
  { id: "dept-prod", name: "Production", code: "PROD", parentId: "dept-exec", level: 2, sortOrder: 2, active: true, headName: "Grace Lim" },
  { id: "dept-qa", name: "Quality Assurance", code: "QA", parentId: "dept-prod", level: 3, sortOrder: 3, active: true, headName: "Nathan Ong" },
  { id: "dept-wh", name: "Warehouse & Logistics", code: "WH", parentId: "dept-prod", level: 3, sortOrder: 4, active: true, headName: "Elena Ramos" },
  { id: "dept-maint", name: "Maintenance", code: "MAINT", parentId: "dept-prod", level: 3, sortOrder: 5, active: true, headName: "Paolo Garcia" },
  { id: "dept-hr", name: "Human Resources", code: "HR", parentId: "dept-exec", level: 2, sortOrder: 6, active: true, headName: "Bianca Flores" },
  { id: "dept-it", name: "Information Technology", code: "IT", parentId: "dept-exec", level: 2, sortOrder: 7, active: true, headName: "Maria Santos" },
  { id: "dept-gad", name: "General Administration", code: "GAD", parentId: "dept-exec", level: 2, sortOrder: 8, active: true, headName: "Andres Villa" },
  { id: "dept-sec", name: "Security", code: "SEC", parentId: "dept-gad", level: 3, sortOrder: 9, active: true, headName: "Marco Diaz" },
  { id: "dept-fin", name: "Finance & Accounting", code: "FIN", parentId: "dept-exec", level: 2, sortOrder: 10, active: true, headName: "Catherine Lim" },
  { id: "dept-purch", name: "Purchasing", code: "PURCH", parentId: "dept-fin", level: 3, sortOrder: 11, active: true, headName: "Diana Reyes" },
];

// ============================================================
// 3. POSITIONS
// ============================================================
export const POSITIONS: Position[] = [
  { id: "pos-president", title: "President", code: "PRES", departmentId: "dept-exec", departmentName: "Executive Office", defaultRole: "super_admin", level: 1, approvalAuthority: true, active: true },
  { id: "pos-gm", title: "General Manager", code: "GM", departmentId: "dept-exec", departmentName: "Executive Office", defaultRole: "executive", reportsToPositionId: "pos-president", reportsToTitle: "President", level: 2, approvalAuthority: true, maxApprovalAmount: 10000000, active: true },
  { id: "pos-prod-mgr", title: "Production Manager", code: "PROD-MGR", departmentId: "dept-prod", departmentName: "Production", defaultRole: "manager", reportsToPositionId: "pos-gm", reportsToTitle: "General Manager", level: 3, approvalAuthority: true, maxApprovalAmount: 500000, active: true },
  { id: "pos-qa-mgr", title: "QA Manager", code: "QA-MGR", departmentId: "dept-qa", departmentName: "Quality Assurance", defaultRole: "manager", reportsToPositionId: "pos-prod-mgr", reportsToTitle: "Production Manager", level: 4, approvalAuthority: true, active: true },
  { id: "pos-wh-mgr", title: "Warehouse Manager", code: "WH-MGR", departmentId: "dept-wh", departmentName: "Warehouse & Logistics", defaultRole: "manager", reportsToPositionId: "pos-prod-mgr", reportsToTitle: "Production Manager", level: 4, approvalAuthority: true, active: true },
  { id: "pos-maint-mgr", title: "Maintenance Manager", code: "MAINT-MGR", departmentId: "dept-maint", departmentName: "Maintenance", defaultRole: "manager", reportsToPositionId: "pos-prod-mgr", reportsToTitle: "Production Manager", level: 4, approvalAuthority: true, active: true },
  { id: "pos-supervisor", title: "Production Supervisor", code: "PROD-SUP", departmentId: "dept-prod", departmentName: "Production", defaultRole: "supervisor", reportsToPositionId: "pos-prod-mgr", reportsToTitle: "Production Manager", level: 5, approvalAuthority: true, maxApprovalAmount: 25000, active: true },
  { id: "pos-hr-mgr", title: "HR Manager", code: "HR-MGR", departmentId: "dept-hr", departmentName: "Human Resources", defaultRole: "hr", reportsToPositionId: "pos-gm", reportsToTitle: "General Manager", level: 3, approvalAuthority: true, active: true },
  { id: "pos-hr-officer", title: "HR Officer", code: "HR-OFF", departmentId: "dept-hr", departmentName: "Human Resources", defaultRole: "hr", reportsToPositionId: "pos-hr-mgr", reportsToTitle: "HR Manager", level: 4, approvalAuthority: false, active: true },
  { id: "pos-gad-mgr", title: "GAD Manager", code: "GAD-MGR", departmentId: "dept-gad", departmentName: "General Administration", defaultRole: "gad", reportsToPositionId: "pos-gm", reportsToTitle: "General Manager", level: 3, approvalAuthority: true, active: true },
  { id: "pos-gad-officer", title: "GAD Officer", code: "GAD-OFF", departmentId: "dept-gad", departmentName: "General Administration", defaultRole: "gad", reportsToPositionId: "pos-gad-mgr", reportsToTitle: "GAD Manager", level: 4, approvalAuthority: false, active: true },
  { id: "pos-it-mgr", title: "IT Manager", code: "IT-MGR", departmentId: "dept-it", departmentName: "Information Technology", defaultRole: "admin", reportsToPositionId: "pos-gm", reportsToTitle: "General Manager", level: 3, approvalAuthority: true, active: true },
  { id: "pos-security", title: "Security Officer", code: "SEC-OFF", departmentId: "dept-sec", departmentName: "Security", defaultRole: "security", reportsToPositionId: "pos-gad-mgr", reportsToTitle: "GAD Manager", level: 5, approvalAuthority: false, active: true },
  { id: "pos-operator", title: "Production Operator", code: "PROD-OP", departmentId: "dept-prod", departmentName: "Production", defaultRole: "employee", reportsToPositionId: "pos-supervisor", reportsToTitle: "Production Supervisor", level: 6, approvalAuthority: false, active: true },
  { id: "pos-qa-inspector", title: "QA Inspector", code: "QA-INSP", departmentId: "dept-qa", departmentName: "Quality Assurance", defaultRole: "employee", reportsToPositionId: "pos-qa-mgr", reportsToTitle: "QA Manager", level: 5, approvalAuthority: false, active: true },
  { id: "pos-warehouse", title: "Warehouse Staff", code: "WH-STAFF", departmentId: "dept-wh", departmentName: "Warehouse & Logistics", defaultRole: "employee", reportsToPositionId: "pos-wh-mgr", reportsToTitle: "Warehouse Manager", level: 5, approvalAuthority: false, active: true },
  { id: "pos-maint-lead", title: "Maintenance Lead", code: "MAINT-LEAD", departmentId: "dept-maint", departmentName: "Maintenance", defaultRole: "supervisor", reportsToPositionId: "pos-maint-mgr", reportsToTitle: "Maintenance Manager", level: 5, approvalAuthority: false, active: true },
  { id: "pos-fin-mgr", title: "Finance Manager", code: "FIN-MGR", departmentId: "dept-fin", departmentName: "Finance & Accounting", defaultRole: "manager", reportsToPositionId: "pos-gm", reportsToTitle: "General Manager", level: 3, approvalAuthority: true, maxApprovalAmount: 1000000, active: true },
  { id: "pos-purch-mgr", title: "Purchasing Manager", code: "PURCH-MGR", departmentId: "dept-purch", departmentName: "Purchasing", defaultRole: "admin", reportsToPositionId: "pos-fin-mgr", reportsToTitle: "Finance Manager", level: 4, approvalAuthority: true, maxApprovalAmount: 500000, active: true },
];

// ============================================================
// 4. EMPLOYEES EXTENDED
// ============================================================
export const EMPLOYEES_EXTENDED: EmployeeExtended[] = [
  { id: "EMP-1042", name: "Liza Mendoza", email: "liza.mendoza@hst-corp.com", title: "Production Associate", departmentId: "dept-prod", departmentName: "Production", status: "Active", role: "employee", positionId: "pos-operator", positionTitle: "Production Operator", supervisorId: "EMP-1043", supervisorName: "Jomar Reyes", joined: "2021-03-14" },
  { id: "EMP-1043", name: "Jomar Reyes", email: "jomar.reyes@hst-corp.com", title: "Line Supervisor", departmentId: "dept-prod", departmentName: "Production", status: "Active", role: "supervisor", positionId: "pos-supervisor", positionTitle: "Production Supervisor", supervisorId: "EMP-1044", supervisorName: "Grace Lim", joined: "2018-07-01" },
  { id: "EMP-1044", name: "Grace Lim", email: "grace.lim@hst-corp.com", title: "Production Manager", departmentId: "dept-prod", departmentName: "Production", status: "Active", role: "manager", positionId: "pos-prod-mgr", positionTitle: "Production Manager", supervisorId: "EMP-1000", supervisorName: "Robert Tan", joined: "2015-01-20" },
  { id: "EMP-1050", name: "Bianca Flores", email: "bianca.flores@hst-corp.com", title: "HR Officer", departmentId: "dept-hr", departmentName: "Human Resources", status: "Active", role: "hr", positionId: "pos-hr-officer", positionTitle: "HR Officer", supervisorId: "EMP-1051", supervisorName: "Catherine Reyes", joined: "2019-09-11" },
  { id: "EMP-1061", name: "Andres Villa", email: "andres.villa@hst-corp.com", title: "GAD Officer", departmentId: "dept-gad", departmentName: "General Administration", status: "Active", role: "gad", positionId: "pos-gad-officer", positionTitle: "GAD Officer", supervisorId: "EMP-1062", supervisorName: "Luis Mercado", joined: "2017-05-03" },
  { id: "EMP-1077", name: "Marco Diaz", email: "marco.diaz@hst-corp.com", title: "Security Officer", departmentId: "dept-sec", departmentName: "Security", status: "Active", role: "security", positionId: "pos-security", positionTitle: "Security Officer", supervisorId: "EMP-1061", supervisorName: "Andres Villa", joined: "2020-02-18" },
  { id: "EMP-1088", name: "Nathan Ong", email: "nathan.ong@hst-corp.com", title: "QA Lead", departmentId: "dept-qa", departmentName: "Quality Assurance", status: "Active", role: "supervisor", positionId: "pos-qa-mgr", positionTitle: "QA Manager", supervisorId: "EMP-1044", supervisorName: "Grace Lim", joined: "2016-11-29" },
  { id: "EMP-1090", name: "Elena Ramos", email: "elena.ramos@hst-corp.com", title: "Warehouse Manager", departmentId: "dept-wh", departmentName: "Warehouse & Logistics", status: "On Leave", role: "manager", positionId: "pos-wh-mgr", positionTitle: "Warehouse Manager", supervisorId: "EMP-1044", supervisorName: "Grace Lim", joined: "2014-08-06" },
  { id: "EMP-1099", name: "Paolo Garcia", email: "paolo.garcia@hst-corp.com", title: "Maintenance Lead", departmentId: "dept-maint", departmentName: "Maintenance", status: "Active", role: "supervisor", positionId: "pos-maint-lead", positionTitle: "Maintenance Lead", supervisorId: "EMP-1100", supervisorName: "Dante Villanueva", joined: "2019-04-22" },
  { id: "EMP-1105", name: "Carla Mateo", email: "carla.mateo@hst-corp.com", title: "Machine Operator", departmentId: "dept-prod", departmentName: "Production", status: "Active", role: "employee", positionId: "pos-operator", positionTitle: "Production Operator", supervisorId: "EMP-1043", supervisorName: "Jomar Reyes", joined: "2022-06-30" },
  { id: "EMP-1000", name: "Robert Tan", email: "robert.tan@hst-corp.com", title: "Plant General Manager", departmentId: "dept-exec", departmentName: "Executive Office", status: "Active", role: "executive", positionId: "pos-gm", positionTitle: "General Manager", supervisorId: "EMP-0999", supervisorName: "Daniel Cruz", joined: "2010-03-01" },
  { id: "EMP-0999", name: "Daniel Cruz", email: "daniel.cruz@hst-corp.com", title: "System Owner", departmentId: "dept-exec", departmentName: "Executive Office", status: "Active", role: "super_admin", positionId: "pos-president", positionTitle: "President", joined: "2005-06-15" },
  { id: "EMP-1062", name: "Luis Mercado", email: "luis.mercado@hst-corp.com", title: "GAD Manager", departmentId: "dept-gad", departmentName: "General Administration", status: "Active", role: "gad", positionId: "pos-gad-mgr", positionTitle: "GAD Manager", supervisorId: "EMP-1000", supervisorName: "Robert Tan", joined: "2016-09-20" },
];

// ============================================================
// 5. CONFIGURABLE PERMISSION MATRIX
// ============================================================
export const PERMISSION_MATRIX: ConfigurablePermission[] = [
  { roleId: "super_admin", moduleId: "gate-pass", actions: ["create", "view", "edit", "delete", "approve", "export", "full"], scope: "all" },
  { roleId: "super_admin", moduleId: "leave", actions: ["full"], scope: "all" },
  { roleId: "super_admin", moduleId: "mrf", actions: ["full"], scope: "all" },
  { roleId: "super_admin", moduleId: "purchase-request", actions: ["full"], scope: "all" },
  { roleId: "super_admin", moduleId: "approvals", actions: ["full"], scope: "all" },
  { roleId: "super_admin", moduleId: "workflows", actions: ["full"], scope: "all" },
  { roleId: "super_admin", moduleId: "reports", actions: ["full"], scope: "all" },
  { roleId: "super_admin", moduleId: "employees", actions: ["full"], scope: "all" },
  { roleId: "super_admin", moduleId: "departments", actions: ["full"], scope: "all" },
  { roleId: "super_admin", moduleId: "settings", actions: ["full"], scope: "all" },
  { roleId: "super_admin", moduleId: "users", actions: ["full"], scope: "all" },
  { roleId: "super_admin", moduleId: "dashboard", actions: ["full"], scope: "all" },
  { roleId: "admin", moduleId: "gate-pass", actions: ["create", "view", "edit", "approve", "export"], scope: "all" },
  { roleId: "admin", moduleId: "leave", actions: ["create", "view", "edit", "approve", "export"], scope: "all" },
  { roleId: "admin", moduleId: "mrf", actions: ["create", "view", "edit", "approve", "export"], scope: "all" },
  { roleId: "admin", moduleId: "purchase-request", actions: ["create", "view", "edit", "approve", "export"], scope: "all" },
  { roleId: "admin", moduleId: "approvals", actions: ["view", "approve"], scope: "all" },
  { roleId: "admin", moduleId: "workflows", actions: ["view", "edit"], scope: "all" },
  { roleId: "admin", moduleId: "employees", actions: ["create", "view", "edit", "export"], scope: "all" },
  { roleId: "admin", moduleId: "users", actions: ["manage"], scope: "all" },
  { roleId: "admin", moduleId: "settings", actions: ["manage"], scope: "all" },
  { roleId: "manager", moduleId: "gate-pass", actions: ["create", "view", "approve"], scope: "department" },
  { roleId: "manager", moduleId: "leave", actions: ["create", "view", "approve"], scope: "department" },
  { roleId: "manager", moduleId: "mrf", actions: ["create", "view", "approve"], scope: "department" },
  { roleId: "manager", moduleId: "purchase-request", actions: ["create", "view", "approve"], scope: "department" },
  { roleId: "manager", moduleId: "approvals", actions: ["view", "approve"], scope: "department" },
  { roleId: "manager", moduleId: "employees", actions: ["view"], scope: "department" },
  { roleId: "manager", moduleId: "reports", actions: ["view"], scope: "department" },
  { roleId: "supervisor", moduleId: "gate-pass", actions: ["create", "view", "approve"], scope: "department" },
  { roleId: "supervisor", moduleId: "leave", actions: ["create", "view", "approve"], scope: "department" },
  { roleId: "supervisor", moduleId: "mrf", actions: ["create", "view", "approve"], scope: "department" },
  { roleId: "supervisor", moduleId: "approvals", actions: ["view", "approve"], scope: "department" },
  { roleId: "employee", moduleId: "gate-pass", actions: ["create", "view"], scope: "own" },
  { roleId: "employee", moduleId: "leave", actions: ["create", "view"], scope: "own" },
  { roleId: "employee", moduleId: "mrf", actions: ["create", "view"], scope: "own" },
  { roleId: "employee", moduleId: "purchase-request", actions: ["create", "view"], scope: "own" },
  { roleId: "hr", moduleId: "leave", actions: ["view", "edit", "approve", "export"], scope: "all" },
  { roleId: "hr", moduleId: "employees", actions: ["create", "view", "edit", "export"], scope: "all" },
  { roleId: "hr", moduleId: "approvals", actions: ["view", "approve"], scope: "all" },
  { roleId: "gad", moduleId: "gate-pass", actions: ["view", "edit", "approve"], scope: "all" },
  { roleId: "security", moduleId: "gate-pass", actions: ["view"], scope: "all" },
  { roleId: "security", moduleId: "visitors", actions: ["view", "edit"], scope: "all" },
];

// ============================================================
// 6. NOTIFICATION RULES
// ============================================================
export const NOTIFICATION_RULES: NotificationRule[] = [
  {
    id: "nr-1", moduleId: "gate-pass", event: "submitted",
    notifyRoles: ["supervisor", "manager"], notifyUsers: [],
    channels: ["in_app"],
    templateSubject: "New Gate Pass {{control_number}}",
    templateBody: "A new gate pass request {{title}} ({{control_number}}) has been submitted by {{requester}}.",
    active: true,
  },
  {
    id: "nr-2", moduleId: "gate-pass", event: "approved",
    notifyRoles: ["employee"], notifyUsers: [],
    channels: ["in_app", "email"],
    templateSubject: "Gate Pass {{control_number}} Approved",
    templateBody: "Your gate pass {{title}} ({{control_number}}) has been approved by {{approver}}.",
    active: true,
  },
  {
    id: "nr-3", moduleId: "leave", event: "submitted",
    notifyRoles: ["supervisor"], notifyUsers: [],
    channels: ["in_app"],
    templateSubject: "New Leave {{control_number}}",
    templateBody: "{{requester}} has filed a leave request {{title}} starting {{start_date}}.",
    active: true,
  },
  {
    id: "nr-4", moduleId: "leave", event: "approved",
    notifyRoles: ["employee"], notifyUsers: [],
    channels: ["in_app"],
    templateSubject: "Leave {{control_number}} Approved",
    templateBody: "Your leave request ({{control_number}}) has been approved.",
    active: true,
  },
  {
    id: "nr-5", moduleId: "purchase-request", event: "submitted",
    notifyRoles: ["manager"], notifyUsers: [],
    channels: ["in_app"],
    templateSubject: "New Purchase Request {{control_number}}",
    templateBody: "A purchase request {{title}} ({{control_number}}) worth {{amount}} needs your review.",
    active: true,
  },
  {
    id: "nr-6", moduleId: "mrf", event: "submitted",
    notifyRoles: ["manager", "hr"], notifyUsers: [],
    channels: ["in_app"],
    templateSubject: "New MRF {{control_number}}",
    templateBody: "A manpower request {{title}} ({{control_number}}) has been submitted.",
    active: true,
  },
  {
    id: "nr-7", moduleId: "gate-pass", event: "rejected",
    notifyRoles: ["employee"], notifyUsers: [],
    channels: ["in_app"],
    templateSubject: "Gate Pass {{control_number}} Rejected",
    templateBody: "Your gate pass {{title}} ({{control_number}}) was rejected. Reason: {{reason}}.",
    active: true,
  },
  {
    id: "nr-8", moduleId: "gate-pass", event: "escalated",
    notifyRoles: ["manager", "admin"], notifyUsers: [],
    channels: ["in_app", "email"],
    templateSubject: "Gate Pass {{control_number}} Escalated",
    templateBody: "Gate pass {{control_number}} has been escalated due to timeout at {{step}} step.",
    active: true,
  },
];

// ============================================================
// 7. DOCUMENT NUMBER FORMATS
// ============================================================
export const DOCUMENT_FORMATS: DocumentNumberFormat[] = [
  { id: "df-gp", moduleId: "gate-pass", name: "Gate Pass", prefix: "GP", separator: "-", includeYear: true, includeMonth: false, includeDepartment: false, sequenceLength: 6, format: "{PREFIX}{SEP}{YEAR}{SEP}{SEQ}", nextSequence: 482, active: true },
  { id: "df-lv", moduleId: "leave", name: "Leave", prefix: "LV", separator: "-", includeYear: true, includeMonth: false, includeDepartment: false, sequenceLength: 6, format: "{PREFIX}{SEP}{YEAR}{SEP}{SEQ}", nextSequence: 1204, active: true },
  { id: "df-mrf", moduleId: "mrf", name: "MRF", prefix: "MRF", separator: "-", includeYear: true, includeMonth: false, includeDepartment: false, sequenceLength: 6, format: "{PREFIX}{SEP}{YEAR}{SEP}{SEQ}", nextSequence: 318, active: true },
  { id: "df-pr", moduleId: "purchase-request", name: "Purchase Request", prefix: "PR", separator: "-", includeYear: true, includeMonth: false, includeDepartment: false, sequenceLength: 6, format: "{PREFIX}{SEP}{YEAR}{SEP}{SEQ}", nextSequence: 921, active: true },
  { id: "df-vis", moduleId: "visitors", name: "Visitor Entry", prefix: "VIS", separator: "-", includeYear: true, includeMonth: true, includeDepartment: false, sequenceLength: 4, format: "{PREFIX}{SEP}{YEAR}{SEP}{MONTH}{SEP}{SEQ}", nextSequence: 501, active: true },
  { id: "df-ast", moduleId: "assets", name: "Asset Tag", prefix: "AST", separator: "-", includeYear: false, includeMonth: false, includeDepartment: false, sequenceLength: 4, format: "{PREFIX}{SEP}{SEQ}", nextSequence: 2201, active: true },
  { id: "df-veh", moduleId: "vehicles", name: "Vehicle ID", prefix: "V", separator: "-", includeYear: false, includeMonth: false, includeDepartment: false, sequenceLength: 2, format: "{PREFIX}{SEP}{SEQ}", nextSequence: 5, active: true },
];

// ============================================================
// 8. WORKFLOW TEMPLATES
// ============================================================
export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  { id: "wt-manufacturing", name: "Standard Manufacturing Workflow", description: "Employee → Supervisor → Manager → GAD → Security", category: "Manufacturing", defaultSteps: ["employee", "supervisor", "manager", "gad", "security"], active: true },
  { id: "wt-hr", name: "Standard HR Workflow", description: "Employee → Supervisor → Manager → HR", category: "Human Resources", defaultSteps: ["employee", "supervisor", "manager", "hr"], active: true },
  { id: "wt-procurement", name: "Standard Procurement Workflow", description: "Employee → Manager → Purchasing → Finance", category: "Procurement", defaultSteps: ["employee", "manager", "admin", "admin"], active: true },
  { id: "wt-simple", name: "Simple 2-Step Workflow", description: "Employee → Manager", category: "General", defaultSteps: ["employee", "manager"], active: true },
  { id: "wt-executive", name: "Executive Approval Workflow", description: "Employee → Manager → Executive", category: "General", defaultSteps: ["employee", "manager", "executive"], active: true },
];

// ============================================================
// 9. HOLIDAY CALENDAR
// ============================================================
export const HOLIDAYS: Holiday[] = [
  { id: "hol-1", name: "New Year's Day", date: "2026-01-01", type: "regular", recurring: true },
  { id: "hol-2", name: "Maundy Thursday", date: "2026-04-02", type: "regular", recurring: false },
  { id: "hol-3", name: "Good Friday", date: "2026-04-03", type: "regular", recurring: false },
  { id: "hol-4", name: "Araw ng Kagitingan", date: "2026-04-09", type: "regular", recurring: true },
  { id: "hol-5", name: "Labor Day", date: "2026-05-01", type: "regular", recurring: true },
  { id: "hol-6", name: "Independence Day", date: "2026-06-12", type: "regular", recurring: true },
  { id: "hol-7", name: "National Heroes Day", date: "2026-08-31", type: "regular", recurring: false },
  { id: "hol-8", name: "Bonifacio Day", date: "2026-11-30", type: "regular", recurring: true },
  { id: "hol-9", name: "Christmas Eve", date: "2026-12-24", type: "special_non_working", recurring: true },
  { id: "hol-10", name: "Christmas Day", date: "2026-12-25", type: "regular", recurring: true },
  { id: "hol-11", name: "Rizal Day", date: "2026-12-30", type: "regular", recurring: true },
  { id: "hol-12", name: "New Year's Eve", date: "2026-12-31", type: "special_non_working", recurring: true },
  { id: "hol-13", name: "Company Foundation Day", date: "2026-07-15", type: "company_event", recurring: false, description: "HST Technologies Foundation Anniversary" },
  { id: "hol-14", name: "Christmas Party", date: "2026-12-18", type: "company_event", recurring: false, description: "Company-wide Christmas celebration" },
];

// ============================================================
// 10. BUSINESS RULES
// ============================================================
export const BUSINESS_RULES: BusinessRule[] = [
  {
    id: "br-1", name: "High-value Purchase → Finance", description: "Purchases over ₱250,000 require Finance approval", moduleId: "purchase-request", priority: 1,
    conditions: [{ field: "amount", operator: "gt", value: 250000 }],
    actions: [{ type: "insert_step", target: "workflow", value: "finance" }],
    active: true,
  },
  {
    id: "br-2", name: "Company Vehicle → Vehicle Coordinator", description: "If transportation is company vehicle, add vehicle coordinator step", moduleId: "gate-pass", priority: 1,
    conditions: [{ field: "transportation", operator: "eq", value: "company_vehicle" }],
    actions: [{ type: "insert_step", target: "workflow", value: "gad" }, { type: "notify", target: "role", value: "gad" }],
    active: true,
  },
  {
    id: "br-3", name: "Urgent Requests → Priority", description: "Mark requests as urgent if amount exceeds ₱500,000", moduleId: "purchase-request", priority: 2,
    conditions: [{ field: "amount", operator: "gt", value: 500000 }],
    actions: [{ type: "set_priority", target: "request", value: "urgent" }],
    active: true,
  },
  {
    id: "br-4", name: "Weekend Gate Pass → GAD Required", description: "Weekend gate passes require GAD pre-approval", moduleId: "gate-pass", priority: 1,
    conditions: [{ field: "is_weekend", operator: "eq", value: "true" }],
    actions: [{ type: "insert_step", target: "workflow", value: "gad_approval" }, { type: "notify", target: "role", value: "gad" }],
    active: true,
  },
  {
    id: "br-5", name: "Long Leave (5+ days) → HR Approval", description: "Leaves longer than 5 days require HR approval", moduleId: "leave", priority: 1,
    conditions: [{ field: "days", operator: "gte", value: 5 }],
    actions: [{ type: "insert_step", target: "workflow", value: "hr_approval" }, { type: "notify", target: "role", value: "hr" }],
    active: true,
  },
  {
    id: "br-6", name: "Sick Leave with Doctor's Note", description: "Sick leave requests require medical certificate attachment", moduleId: "leave", priority: 2,
    conditions: [{ field: "leave_type", operator: "eq", value: "sick" }],
    actions: [{ type: "require_attachment", target: "document", value: "medical_certificate" }],
    active: true,
  },
];

// ============================================================
// 11. SYSTEM SETTINGS
// ============================================================
export const SYSTEM_SETTINGS: SystemSetting[] = [
  { key: "app.name", value: "HST Enterprise Portal", category: "general", description: "Application display name", type: "text" },
  { key: "app.version", value: "2.0.0", category: "general", description: "Current version", type: "text" },
  { key: "auth.session_timeout", value: "480", category: "security", description: "Session timeout in minutes", type: "number" },
  { key: "auth.max_login_attempts", value: "5", category: "security", description: "Maximum failed login attempts", type: "number" },
  { key: "auth.password_min_length", value: "8", category: "security", description: "Minimum password length", type: "number" },
  { key: "auth.two_factor_enabled", value: "false", category: "security", description: "Enable two-factor authentication", type: "boolean" },
  { key: "notifications.email_enabled", value: "true", category: "notifications", description: "Enable email notifications", type: "boolean" },
  { key: "notifications.sms_enabled", value: "false", category: "notifications", description: "Enable SMS notifications", type: "boolean" },
  { key: "notifications.escalation_check_interval", value: "60", category: "notifications", description: "Escalation check interval in minutes", type: "number" },
  { key: "approvals.auto_approve_threshold", value: "10000", category: "approvals", description: "Auto-approve amount threshold", type: "number" },
  { key: "approvals.require_comment_on_reject", value: "true", category: "approvals", description: "Require comment when rejecting", type: "boolean" },
  { key: "ui.theme", value: "system", category: "ui", description: "Default theme (light/dark/system)", type: "select", options: ["light", "dark", "system"] },
  { key: "ui.items_per_page", value: "25", category: "ui", description: "Default items per page in tables", type: "number" },
  { key: "ui.date_format", value: "YYYY-MM-DD", category: "ui", description: "Date display format", type: "select", options: ["YYYY-MM-DD", "MM/DD/YYYY", "DD/MM/YYYY"] },
  { key: "audit.retention_days", value: "365", category: "audit", description: "Audit log retention in days", type: "number" },
];

// ============================================================
// 12. ROLE CONFIGURATIONS
// ============================================================
export const ROLE_CONFIGS: RoleConfig[] = [
  { id: "super_admin", name: "Super Administrator", shortName: "Super Admin", level: 1, description: "Full control of every module, user, role, workflow and system setting.", active: true },
  { id: "admin", name: "System Administrator", shortName: "Administrator", level: 2, description: "Manages the ERP: employees, modules, users, departments and approvals.", active: true },
  { id: "executive", name: "Executive", shortName: "Executive", level: 3, description: "Company dashboard, executive KPIs, analytics and approval monitoring.", active: true },
  { id: "manager", name: "Department Manager", shortName: "Manager", level: 4, description: "Department statistics, requests, approvals, employees and reports.", active: true },
  { id: "supervisor", name: "Supervisor", shortName: "Supervisor", level: 5, description: "Approval queue, team requests, employee monitoring and recommendations.", active: true },
  { id: "hr", name: "HR Officer", shortName: "HR", level: 6, description: "Employee profiles, leave, visitors, records and HR reports.", active: true },
  { id: "gad", name: "General Administration", shortName: "GAD", level: 7, description: "Gate pass final approval, vehicle assignment, meal allowance and reports.", active: true },
  { id: "security", name: "Security Guard", shortName: "Security", level: 8, description: "Today's gate pass, QR verification, vehicle in/out and visitor verification.", active: true },
  { id: "employee", name: "Employee", shortName: "Employee", level: 9, description: "Create and track own requests: gate pass, leave, MRF, purchase and more.", active: true },
];