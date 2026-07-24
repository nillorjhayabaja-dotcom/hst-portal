// Approval Engine Types - Universal Approval & Workflow Engine
// Version 2.0 - Enhanced with Workflow Builder, Escalation, Conditional Routing
import type { RoleId, ModuleId } from "@/types";

// ============================================================
// Workflow Configuration (Admin-configurable)
// ============================================================
export interface WorkflowStep {
  id: string;
  name: string;
  role: RoleId;
  order: number;
  required: boolean;
  label: string;
  description?: string;
  autoApprove?: boolean;
  timeoutHours?: number;
  // Escalation
  escalationEnabled?: boolean;
  escalationToRole?: RoleId;
  escalationHours?: number;
  // Conditional routing
  condition?: WorkflowCondition;
  // Parallel approval
  parallelApproval?: boolean;
  parallelRoles?: RoleId[];
}

export interface WorkflowCondition {
  field: string; // e.g. "amount", "priority", "department"
  operator: "gt" | "gte" | "lt" | "lte" | "eq" | "neq" | "in";
  value: string | number | string[];
}

export interface WorkflowConfig {
  id: string;
  moduleId: ModuleId;
  name: string;
  description: string;
  steps: WorkflowStep[];
  active: boolean;
  version: number;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================
// Approval Request
// ============================================================
export type ApprovalStatus =
  | "draft"
  | "pending"
  | "in_review"
  | "approved"
  | "rejected"
  | "returned"
  | "cancelled"
  | "completed";

export type StepStatus = "pending" | "current" | "approved" | "rejected" | "skipped" | "escalated";

export interface ApprovalStepInstance {
  stepId: string;
  name: string;
  role: RoleId;
  order: number;
  status: StepStatus;
  required: boolean;
  actor?: string;
  actorName?: string;
  date?: string;
  note?: string;
  duration?: string;
  // Escalation tracking
  escalated?: boolean;
  escalatedAt?: string;
  originalActor?: string;
  // Parallel approval support
  parallelApproval?: boolean;
  parallelRoles?: RoleId[];
}

export interface ApprovalRequest {
  id: string;
  controlNumber: string;
  moduleId: ModuleId;
  title: string;
  description?: string;
  requesterId: string;
  requesterName: string;
  department: string;
  status: ApprovalStatus;
  priority: "low" | "normal" | "high" | "urgent";
  workflowId: string;
  steps: ApprovalStepInstance[];
  currentStepIndex: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  metadata?: Record<string, unknown>;
  // Delegation tracking
  delegatedTo?: string;
  delegatedByName?: string;
}

// ============================================================
// Delegation
// ============================================================
export interface DelegationRule {
  id: string;
  delegatorId: string;
  delegatorName?: string;
  delegateId: string;
  delegateName?: string;
  moduleId?: ModuleId;
  startDate: string;
  endDate: string;
  active: boolean;
  reason: string;
  createdAt?: string;
}

// ============================================================
// Control Number
// ============================================================
export interface ControlNumberConfig {
  id: string;
  moduleId: ModuleId;
  prefix: string;
  year: number;
  format: string;
  sequence: number;
  padding: number;
  active: boolean;
}

// ============================================================
// Notification
// ============================================================
export type NotificationType =
  | "approval_required"
  | "approved"
  | "rejected"
  | "returned"
  | "delegated"
  | "reminder"
  | "system"
  | "comment"
  | "status_change"
  | "escalated";

export interface ApprovalNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  requestId: string;
  controlNumber: string;
  moduleId: ModuleId;
  recipientId: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

// ============================================================
// Approval Action
// ============================================================
export type ApprovalAction = "approve" | "reject" | "return" | "delegate" | "recall";

export interface ApprovalActionLog {
  id: string;
  requestId: string;
  stepId: string;
  action: ApprovalAction;
  actorId: string;
  actorName: string;
  note?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// ============================================================
// Permission Matrix (enhanced)
// ============================================================
export type GranularAction =
  "view" | "create" | "edit" | "delete" | "approve" | "reject" | "return" | "manage" | "full";

export interface PermissionRule {
  roleId: RoleId;
  moduleId: ModuleId;
  actions: GranularAction[];
  scope: "all" | "department" | "own";
}

// ============================================================
// Approval Analytics
// ============================================================
export interface ApprovalMetrics {
  totalRequests: number;
  pendingApprovals: number;
  approvedToday: number;
  rejectedToday: number;
  averageApprovalTime: number; // hours
  approvalRate: number; // percentage
  byModule: Record<string, number>;
  byPriority: Record<string, number>;
  byDepartment: Record<string, number>;
  monthlyTrend: { month: string; submitted: number; approved: number; rejected: number }[];
}

export interface ApproverPerformance {
  approverId: string;
  approverName: string;
  totalDecisions: number;
  approved: number;
  rejected: number;
  averageDecisionTime: number;
}

// ============================================================
// Escalation Rules
// ============================================================
export interface EscalationRule {
  id: string;
  workflowId: string;
  stepId: string;
  timeoutHours: number;
  escalateToRole: RoleId;
  escalateToUser?: string;
  notifyBeforeTimeout: boolean;
  notifyHoursBefore: number;
}

// ============================================================
// Approval Summary (for lists/display)
// ============================================================
export interface ApprovalSummary {
  id: string;
  controlNumber: string;
  moduleId: ModuleId;
  title: string;
  requesterName: string;
  department: string;
  status: ApprovalStatus;
  priority: "low" | "normal" | "high" | "urgent";
  currentStepName: string;
  currentStepRole: RoleId;
  createdAt: string;
  updatedAt: string;
}
