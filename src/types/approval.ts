// Approval Engine Types - Universal Approval & Workflow Engine
import type { RoleId, ModuleId } from "@/types";

// ============================================================
// Workflow Configuration
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
}

export interface WorkflowConfig {
  id: string;
  moduleId: ModuleId;
  name: string;
  description: string;
  steps: WorkflowStep[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Approval Request
// ============================================================
export type ApprovalStatus = "draft" | "pending" | "in_review" | "approved" | "rejected" | "returned" | "cancelled" | "completed";

export type StepStatus = "pending" | "current" | "approved" | "rejected" | "skipped";

export interface ApprovalStepInstance {
  stepId: string;
  name: string;
  role: RoleId;
  order: number;
  status: StepStatus;
  actor?: string;
  actorName?: string;
  date?: string;
  note?: string;
  duration?: string;
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
}

// ============================================================
// Delegation
// ============================================================
export interface DelegationRule {
  id: string;
  delegatorId: string;
  delegatorName: string;
  delegateId: string;
  delegateName: string;
  moduleId?: ModuleId; // undefined = all modules
  startDate: string;
  endDate: string;
  active: boolean;
  reason: string;
  createdAt: string;
}

// ============================================================
// Control Number
// ============================================================
export interface ControlNumberConfig {
  id: string;
  moduleId: ModuleId;
  prefix: string;
  year: number;
  format: string; // e.g. "{PREFIX}-{YEAR}-{SEQUENCE:6}"
  sequence: number;
  padding: number;
  active: boolean;
}

// ============================================================
// Notification
// ============================================================
export type NotificationType = "approval_required" | "approved" | "rejected" | "returned" | "delegated" | "reminder" | "system" | "comment" | "status_change";

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
export type GranularAction = "view" | "create" | "edit" | "delete" | "approve" | "reject" | "return" | "manage" | "full";

export interface PermissionRule {
  roleId: RoleId;
  moduleId: ModuleId;
  actions: GranularAction[];
  scope: "all" | "department" | "own";
}