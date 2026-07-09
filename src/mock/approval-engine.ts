// Approval Engine Mock Data - Workflows, requests, delegations, notifications
// Version 2.0 - Updated with required field on step instances
import type { WorkflowConfig, ApprovalRequest, DelegationRule, ApprovalNotification, ControlNumberConfig, ApprovalStepInstance } from "@/types/approval";

// ============================================================
// Workflow Definitions (configurable per module)
// ============================================================
export const WORKFLOWS: WorkflowConfig[] = [
  {
    id: "wf-gp",
    moduleId: "gate-pass",
    name: "Gate Pass Approval Flow",
    description: "Standard gate pass approval workflow",
    active: true,
    createdAt: "2026-01-01",
    updatedAt: "2026-07-01",
    version: 1,
    steps: [
      { id: "s1", name: "Employee", role: "employee", order: 1, required: true, label: "Submit Request" },
      { id: "s2", name: "Supervisor", role: "supervisor", order: 2, required: true, label: "Supervisor Review" },
      { id: "s3", name: "Department Manager", role: "manager", order: 3, required: true, label: "Manager Approval" },
      { id: "s4", name: "General Administration", role: "gad", order: 4, required: true, label: "GAD Clearance" },
      { id: "s5", name: "Security", role: "security", order: 5, required: true, label: "Gate Release" },
    ],
  },
  {
    id: "wf-lv",
    moduleId: "leave",
    name: "Leave Approval Flow",
    description: "Standard leave approval workflow",
    active: true,
    version: 1,
    createdAt: "2026-01-01",
    updatedAt: "2026-07-01",
    steps: [
      { id: "s1", name: "Employee", role: "employee", order: 1, required: true, label: "Submit Request" },
      { id: "s2", name: "Supervisor", role: "supervisor", order: 2, required: true, label: "Supervisor Review" },
      { id: "s3", name: "Manager", role: "manager", order: 3, required: false, label: "Manager Approval" },
      { id: "s4", name: "HR", role: "hr", order: 4, required: true, label: "HR Processing" },
    ],
  },
  {
    id: "wf-mrf",
    moduleId: "mrf",
    name: "MRF Approval Flow",
    description: "Manpower requisition approval workflow",
    active: true,
    version: 1,
    createdAt: "2026-01-01",
    updatedAt: "2026-07-01",
    steps: [
      { id: "s1", name: "Employee", role: "employee", order: 1, required: true, label: "Submit Request" },
      { id: "s2", name: "Manager", role: "manager", order: 2, required: true, label: "Manager Approval" },
      { id: "s3", name: "HR", role: "hr", order: 3, required: true, label: "HR Review" },
    ],
  },
  {
    id: "wf-pr",
    moduleId: "purchase-request",
    name: "Purchase Request Approval Flow",
    description: "Procurement approval workflow",
    active: true,
    version: 1,
    createdAt: "2026-01-01",
    updatedAt: "2026-07-01",
    steps: [
      { id: "s1", name: "Employee", role: "employee", order: 1, required: true, label: "Submit Request" },
      { id: "s2", name: "Manager", role: "manager", order: 2, required: true, label: "Manager Approval" },
      { id: "s3", name: "Purchasing", role: "admin", order: 3, required: true, label: "Purchasing Review" },
      { id: "s4", name: "Finance", role: "admin", order: 4, required: true, label: "Finance Approval" },
    ],
  },
];

// ============================================================
// Control Number Configurations
// ============================================================
export const CONTROL_NUMBERS: ControlNumberConfig[] = [
  { id: "cn-gp", moduleId: "gate-pass", prefix: "GP", year: 2026, format: "{PREFIX}-{YEAR}-{SEQUENCE:6}", sequence: 482, padding: 6, active: true },
  { id: "cn-lv", moduleId: "leave", prefix: "LV", year: 2026, format: "{PREFIX}-{YEAR}-{SEQUENCE:6}", sequence: 1204, padding: 6, active: true },
  { id: "cn-mrf", moduleId: "mrf", prefix: "MRF", year: 2026, format: "{PREFIX}-{YEAR}-{SEQUENCE:6}", sequence: 318, padding: 6, active: true },
  { id: "cn-pr", moduleId: "purchase-request", prefix: "PR", year: 2026, format: "{PREFIX}-{YEAR}-{SEQUENCE:6}", sequence: 921, padding: 6, active: true },
];

// ============================================================
// Sample Approval Requests
// ============================================================
export const APPROVAL_REQUESTS: ApprovalRequest[] = [
  {
    id: "apr-1",
    controlNumber: "GP-2026-000482",
    moduleId: "gate-pass",
    title: "Return defective motor to supplier",
    description: "Outgoing gate pass for defective motor return to ABC Suppliers",
    requesterId: "EMP-1042",
    requesterName: "Liza Mendoza",
    department: "Production",
    status: "in_review",
    priority: "high",
    workflowId: "wf-gp",
    currentStepIndex: 2,
    createdAt: "2026-07-08T09:00:00",
    updatedAt: "2026-07-08T11:15:00",
    steps: [
      { stepId: "s1", name: "Employee", role: "employee", order: 1, required: true, status: "approved", actorName: "Liza Mendoza", date: "2026-07-08 09:00", note: "Submitted request" },
      { stepId: "s2", name: "Supervisor", role: "supervisor", order: 2, required: true, status: "approved", actorName: "Jomar Reyes", date: "2026-07-08 10:30", note: "Documents verified. Recommending approval." },
      { stepId: "s3", name: "Department Manager", role: "manager", order: 3, required: true, status: "current", note: "Awaiting approval" },
      { stepId: "s4", name: "General Administration", role: "gad", order: 4, required: true, status: "pending" },
      { stepId: "s5", name: "Security", role: "security", order: 5, required: true, status: "pending" },
    ],
  },
  {
    id: "apr-2",
    controlNumber: "LV-2026-001204",
    moduleId: "leave",
    title: "Vacation leave — 3 days",
    description: "Annual vacation leave for July 10-12, 2026",
    requesterId: "EMP-1105",
    requesterName: "Carla Mateo",
    department: "Production",
    status: "pending",
    priority: "normal",
    workflowId: "wf-lv",
    currentStepIndex: 1,
    createdAt: "2026-07-07T14:00:00",
    updatedAt: "2026-07-07T14:00:00",
    steps: [
      { stepId: "s1", name: "Employee", role: "employee", order: 1, required: true, status: "approved", actorName: "Carla Mateo", date: "2026-07-07 14:00" },
      { stepId: "s2", name: "Supervisor", role: "supervisor", order: 2, required: true, status: "current", note: "Awaiting review" },
      { stepId: "s3", name: "Manager", role: "manager", order: 3, required: false, status: "pending" },
      { stepId: "s4", name: "HR", role: "hr", order: 4, required: true, status: "pending" },
    ],
  },
  {
    id: "apr-3",
    controlNumber: "PR-2026-000921",
    moduleId: "purchase-request",
    title: "Hydraulic press spare parts",
    description: "Procurement of hydraulic press spare parts for maintenance",
    requesterId: "EMP-1099",
    requesterName: "Paolo Garcia",
    department: "Maintenance",
    status: "in_review",
    priority: "high",
    workflowId: "wf-pr",
    currentStepIndex: 2,
    createdAt: "2026-07-08T08:00:00",
    updatedAt: "2026-07-08T10:00:00",
    steps: [
      { stepId: "s1", name: "Employee", role: "employee", order: 1, required: true, status: "approved", actorName: "Paolo Garcia", date: "2026-07-08 08:00" },
      { stepId: "s2", name: "Manager", role: "manager", order: 2, required: true, status: "approved", actorName: "Grace Lim", date: "2026-07-08 09:00", note: "Approved. Budget available." },
      { stepId: "s3", name: "Purchasing", role: "admin", order: 3, required: true, status: "current", note: "Under review" },
      { stepId: "s4", name: "Finance", role: "admin", order: 4, required: true, status: "pending" },
    ],
  },
  {
    id: "apr-4",
    controlNumber: "MRF-2026-000318",
    moduleId: "mrf",
    title: "Manpower request — 4 operators",
    description: "Request for 4 additional production operators",
    requesterId: "EMP-1044",
    requesterName: "Grace Lim",
    department: "Production",
    status: "approved",
    priority: "urgent",
    workflowId: "wf-mrf",
    currentStepIndex: 3,
    createdAt: "2026-07-05T10:00:00",
    updatedAt: "2026-07-06T16:00:00",
    completedAt: "2026-07-06T16:00:00",
    steps: [
      { stepId: "s1", name: "Employee", role: "employee", order: 1, required: true, status: "approved", actorName: "Grace Lim", date: "2026-07-05 10:00" },
      { stepId: "s2", name: "Manager", role: "manager", order: 2, required: true, status: "approved", actorName: "Grace Lim", date: "2026-07-05 14:00" },
      { stepId: "s3", name: "HR", role: "hr", order: 3, required: true, status: "approved", actorName: "Bianca Flores", date: "2026-07-06 16:00", note: "Approved with budget note" },
    ],
  },
];

// ============================================================
// Delegation Rules
// ============================================================
export const DELEGATION_RULES: DelegationRule[] = [
  {
    id: "del-1",
    delegatorId: "EMP-1044",
    delegatorName: "Grace Lim",
    delegateId: "EMP-1043",
    delegateName: "Jomar Reyes",
    moduleId: "gate-pass",
    startDate: "2026-07-10",
    endDate: "2026-07-15",
    active: true,
    reason: "Grace is on vacation",
    createdAt: "2026-07-01",
  },
];

// ============================================================
// Approval Notifications
// ============================================================
export const APPROVAL_NOTIFICATIONS: ApprovalNotification[] = [
  {
    id: "an-1",
    type: "approval_required",
    title: "Approval required",
    message: "Gate Pass GP-2026-000482 is waiting for your approval",
    requestId: "apr-1",
    controlNumber: "GP-2026-000482",
    moduleId: "gate-pass",
    recipientId: "EMP-1044",
    read: false,
    createdAt: "2026-07-08T11:15:00",
    actionUrl: "/app/m/gate-pass",
  },
  {
    id: "an-2",
    type: "approval_required",
    title: "Approval required",
    message: "Leave LV-2026-001204 requires your review",
    requestId: "apr-2",
    controlNumber: "LV-2026-001204",
    moduleId: "leave",
    recipientId: "EMP-1043",
    read: false,
    createdAt: "2026-07-07T14:00:00",
    actionUrl: "/app/m/leave",
  },
  {
    id: "an-3",
    type: "approved",
    title: "Request approved",
    message: "Your MRF-2026-000318 was approved by HR",
    requestId: "apr-4",
    controlNumber: "MRF-2026-000318",
    moduleId: "mrf",
    recipientId: "EMP-1044",
    read: true,
    createdAt: "2026-07-06T16:00:00",
    actionUrl: "/app/m/mrf",
  },
];

// ============================================================
// Helper Functions
// ============================================================
export function getWorkflowForModule(moduleId: string): WorkflowConfig | undefined {
  return WORKFLOWS.find((w) => w.moduleId === moduleId);
}

export function getPendingApprovalsForRole(roleId: string): ApprovalRequest[] {
  return APPROVAL_REQUESTS.filter((req) => {
    const currentStep = req.steps[req.currentStepIndex];
    return currentStep && currentStep.role === roleId && currentStep.status === "current";
  });
}

export function getApprovalsByStatus(status: string): ApprovalRequest[] {
  return APPROVAL_REQUESTS.filter((req) => req.status === status);
}

export function getNotificationsForUser(userId: string): ApprovalNotification[] {
  return APPROVAL_NOTIFICATIONS.filter((n) => n.recipientId === userId);
}

export function getUnreadNotificationCount(userId: string): number {
  return APPROVAL_NOTIFICATIONS.filter((n) => n.recipientId === userId && !n.read).length;
}