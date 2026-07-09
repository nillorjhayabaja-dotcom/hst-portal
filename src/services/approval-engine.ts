// Approval Engine Service - Universal approval workflow logic
// Version 2.0 - With Workflow Builder, Escalation, Delegation, Analytics
import { toast } from "sonner";
import type {
  ApprovalRequest,
  ApprovalStepInstance,
  ApprovalAction,
  DelegationRule,
  WorkflowConfig,
  ApprovalNotification,
  NotificationType,
  ApprovalActionLog,
  ApprovalMetrics,
  ApproverPerformance,
  EscalationRule,
  ApprovalSummary,
  WorkflowStep,
} from "@/types/approval";
import {
  APPROVAL_REQUESTS,
  APPROVAL_NOTIFICATIONS,
  DELEGATION_RULES,
  WORKFLOWS,
  CONTROL_NUMBERS,
} from "@/mock/approval-engine";

// ============================================================
// In-memory state
// ============================================================
let requests = [...APPROVAL_REQUESTS];
let notifications = [...APPROVAL_NOTIFICATIONS];
let delegations = [...DELEGATION_RULES];
let workflows = [...WORKFLOWS];
let actionLogs: ApprovalActionLog[] = [];

// ============================================================
// Helper: Create Notification
// ============================================================
function createNotification(data: Omit<ApprovalNotification, "id" | "createdAt" | "read">): ApprovalNotification {
  const notification: ApprovalNotification = {
    ...data,
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    read: false,
    createdAt: new Date().toISOString(),
  };
  notifications.unshift(notification);
  return notification;
}

// ============================================================
// Helper: Log approval action
// ============================================================
function logAction(
  requestId: string,
  stepId: string,
  action: ApprovalAction,
  actorId: string,
  actorName: string,
  note?: string,
): void {
  actionLogs.push({
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    requestId,
    stepId,
    action,
    actorId,
    actorName,
    note,
    timestamp: new Date().toISOString(),
  });
}

// ============================================================
// Helper: Check if user has active delegation as approver
// ============================================================
function getDelegateForUser(userId: string, moduleId: string): DelegationRule | undefined {
  const today = new Date().toISOString().split("T")[0];
  return delegations.find((d) => {
    if (d.delegatorId !== userId || !d.active) return false;
    if (d.startDate > today || d.endDate < today) return false;
    if (d.moduleId && d.moduleId !== moduleId) return false;
    return true;
  });
}

// ============================================================
// Helper: Calculate duration between two ISO strings
// ============================================================
function calcDuration(start: string, end: string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

// ============================================================
// Core Approval Actions
// ============================================================
export function approveRequest(
  requestId: string,
  actorId: string,
  actorName: string,
  note?: string,
): ApprovalRequest | null {
  const req = requests.find((r) => r.id === requestId);
  if (!req) {
    toast.error("Request not found");
    return null;
  }

  const currentStep = req.steps[req.currentStepIndex];
  if (!currentStep || currentStep.status !== "current") {
    toast.error("This step is not currently awaiting approval");
    return null;
  }

  // Mark current step as approved
  currentStep.status = "approved";
  currentStep.actor = actorId;
  currentStep.actorName = actorName;
  currentStep.date = new Date().toISOString();
  currentStep.note = note;
  currentStep.duration = calcDuration(
    currentStep.date || req.createdAt,
    new Date().toISOString(),
  );

  logAction(req.id, currentStep.stepId, "approve", actorId, actorName, note);

  // Check for parallel approvals needed
  if (currentStep.parallelApproval && currentStep.parallelRoles) {
    // Check if all parallel steps are approved
    const relatedSteps = req.steps.filter(
      (s) => s.order === currentStep.order && s.status !== "approved",
    );
    if (relatedSteps.length > 0) {
      toast.success(`Step approved. Waiting for parallel approvals.`);
      req.updatedAt = new Date().toISOString();
      return req;
    }
  }

  // Move to next step or complete
  if (req.currentStepIndex < req.steps.length - 1) {
    const nextIndex = findNextStepIndex(req);
    if (nextIndex === -1) {
      // All remaining steps are skipped — mark as complete
      req.status = "approved";
      req.completedAt = new Date().toISOString();
      completeRequest(req);
      return req;
    }
    req.currentStepIndex = nextIndex;
    req.steps[nextIndex].status = "current";
    req.status = "in_review";

    // Check delegation for next step
    const nextStep = req.steps[nextIndex];
    const delegation = getDelegateForUser(actorId, req.moduleId);
    if (delegation) {
      nextStep.actor = delegation.delegateId;
      nextStep.actorName = delegation.delegateName;
      req.delegatedTo = delegation.delegateId;
      req.delegatedByName = delegation.delegateName;
      createNotification({
        type: "delegated",
        title: "Approval delegated",
        message: `${req.controlNumber} was delegated to ${delegation.delegateName}`,
        requestId: req.id,
        controlNumber: req.controlNumber,
        moduleId: req.moduleId,
        recipientId: delegation.delegateId,
        actionUrl: `/app/m/${req.moduleId}`,
      });
    }

    createNotification({
      type: "approval_required",
      title: "Approval required",
      message: `${req.controlNumber} is waiting for ${nextStep.name} approval`,
      requestId: req.id,
      controlNumber: req.controlNumber,
      moduleId: req.moduleId,
      recipientId: delegation?.delegateId || nextStep.actor || `${nextStep.role}-approver`,
      actionUrl: `/app/m/${req.moduleId}`,
    });

    toast.success(`Request approved and forwarded to ${nextStep.name}`);
  } else {
    // Last step approved
    req.status = "approved";
    req.completedAt = new Date().toISOString();
    completeRequest(req);
  }

  req.updatedAt = new Date().toISOString();
  return req;
}

function completeRequest(req: ApprovalRequest): void {
  // Mark any remaining pending steps as skipped
  req.steps.forEach((s) => {
    if (s.status === "pending" || s.status === "current") {
      s.status = "skipped";
    }
  });

  createNotification({
    type: "approved",
    title: "Request approved",
    message: `${req.controlNumber} has been fully approved`,
    requestId: req.id,
    controlNumber: req.controlNumber,
    moduleId: req.moduleId,
    recipientId: req.requesterId,
    actionUrl: `/app/m/${req.moduleId}`,
  });

  toast.success("Request fully approved");
}

function findNextStepIndex(req: ApprovalRequest): number {
  for (let i = req.currentStepIndex + 1; i < req.steps.length; i++) {
    const step = req.steps[i];
    if (step.required || step.status !== "skipped") {
      return i;
    }
  }
  return -1; // All remaining steps are optional and can be skipped
}

export function rejectRequest(
  requestId: string,
  actorId: string,
  actorName: string,
  reason: string,
): ApprovalRequest | null {
  const req = requests.find((r) => r.id === requestId);
  if (!req) {
    toast.error("Request not found");
    return null;
  }

  const currentStep = req.steps[req.currentStepIndex];
  if (!currentStep || currentStep.status !== "current") {
    toast.error("This step is not currently awaiting action");
    return null;
  }

  currentStep.status = "rejected";
  currentStep.actor = actorId;
  currentStep.actorName = actorName;
  currentStep.date = new Date().toISOString();
  currentStep.note = reason;

  req.status = "rejected";
  req.completedAt = new Date().toISOString();
  req.updatedAt = new Date().toISOString();

  logAction(req.id, currentStep.stepId, "reject", actorId, actorName, reason);

  createNotification({
    type: "rejected",
    title: "Request rejected",
    message: `${req.controlNumber} was rejected at ${currentStep.name}: ${reason}`,
    requestId: req.id,
    controlNumber: req.controlNumber,
    moduleId: req.moduleId,
    recipientId: req.requesterId,
    actionUrl: `/app/m/${req.moduleId}`,
  });

  toast.error("Request rejected");
  return req;
}

export function returnRequest(
  requestId: string,
  actorId: string,
  actorName: string,
  note: string,
): ApprovalRequest | null {
  const req = requests.find((r) => r.id === requestId);
  if (!req) {
    toast.error("Request not found");
    return null;
  }

  const currentStep = req.steps[req.currentStepIndex];
  if (!currentStep || currentStep.status !== "current") {
    toast.error("This step is not currently awaiting action");
    return null;
  }

  // Mark current step rejected (returned)
  currentStep.status = "rejected";
  currentStep.actor = actorId;
  currentStep.actorName = actorName;
  currentStep.date = new Date().toISOString();
  currentStep.note = note;

  // Return to previous step
  if (req.currentStepIndex > 0) {
    req.currentStepIndex--;
    const prevStep = req.steps[req.currentStepIndex];
    prevStep.status = "current";
    // Clear previous approval
    prevStep.status = "current";
    prevStep.actor = undefined;
    prevStep.actorName = undefined;
    prevStep.date = undefined;
    prevStep.note = "Returned for revision";
    req.status = "returned";
  } else {
    req.status = "returned";
  }

  req.updatedAt = new Date().toISOString();

  logAction(req.id, currentStep.stepId, "return", actorId, actorName, note);

  createNotification({
    type: "returned",
    title: "Request returned",
    message: `${req.controlNumber} was returned for revision at ${currentStep.name}: ${note}`,
    requestId: req.id,
    controlNumber: req.controlNumber,
    moduleId: req.moduleId,
    recipientId: req.requesterId,
    actionUrl: `/app/m/${req.moduleId}`,
  });

  toast.warning("Request returned for revision");
  return req;
}

export function delegateApproval(
  requestId: string,
  actorId: string,
  actorName: string,
  delegateId: string,
  delegateName: string,
): ApprovalRequest | null {
  const req = requests.find((r) => r.id === requestId);
  if (!req) {
    toast.error("Request not found");
    return null;
  }

  const currentStep = req.steps[req.currentStepIndex];
  if (!currentStep || currentStep.status !== "current") {
    toast.error("This step is not currently awaiting action");
    return null;
  }

  // Delegate the current step
  currentStep.actor = delegateId;
  currentStep.actorName = delegateName;
  req.delegatedTo = delegateId;
  req.delegatedByName = delegateName;

  logAction(req.id, currentStep.stepId, "delegate", actorId, actorName, `Delegated to ${delegateName}`);

  createNotification({
    type: "delegated",
    title: "Approval delegated to you",
    message: `${req.controlNumber} was delegated to you by ${actorName}`,
    requestId: req.id,
    controlNumber: req.controlNumber,
    moduleId: req.moduleId,
    recipientId: delegateId,
    actionUrl: `/app/m/${req.moduleId}`,
  });

  toast.success(`Approval delegated to ${delegateName}`);
  req.updatedAt = new Date().toISOString();
  return req;
}

export function recallRequest(requestId: string, userId: string): boolean {
  const req = requests.find((r) => r.id === requestId);
  if (!req) {
    toast.error("Request not found");
    return false;
  }

  if (req.requesterId !== userId) {
    toast.error("Only the requester can recall this request");
    return false;
  }

  if (req.status !== "pending" && req.status !== "in_review") {
    toast.error("This request cannot be recalled in its current state");
    return false;
  }

  req.status = "cancelled";
  req.updatedAt = new Date().toISOString();

  // Reset all steps
  req.steps.forEach((s) => {
    if (s.status === "current") s.status = "pending";
  });

  createNotification({
    type: "status_change",
    title: "Request cancelled",
    message: `${req.controlNumber} was cancelled by the requester`,
    requestId: req.id,
    controlNumber: req.controlNumber,
    moduleId: req.moduleId,
    recipientId: req.requesterId,
    actionUrl: `/app/m/${req.moduleId}`,
  });

  toast.info("Request cancelled");
  return true;
}

// ============================================================
// Delegation Management
// ============================================================
export function createDelegation(
  rule: Omit<DelegationRule, "id" | "createdAt">,
): DelegationRule {
  const newRule: DelegationRule = {
    ...rule,
    id: `del-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  delegations.push(newRule);
  toast.success("Delegation rule created");
  return newRule;
}

export function updateDelegation(
  id: string,
  updates: Partial<DelegationRule>,
): DelegationRule | null {
  const rule = delegations.find((d) => d.id === id);
  if (!rule) {
    toast.error("Delegation rule not found");
    return null;
  }
  Object.assign(rule, updates);
  toast.success("Delegation rule updated");
  return rule;
}

export function deleteDelegation(id: string): boolean {
  const index = delegations.findIndex((d) => d.id === id);
  if (index === -1) {
    toast.error("Delegation rule not found");
    return false;
  }
  delegations.splice(index, 1);
  toast.success("Delegation rule deleted");
  return true;
}

export function toggleDelegation(id: string): DelegationRule | null {
  const rule = delegations.find((d) => d.id === id);
  if (!rule) return null;
  rule.active = !rule.active;
  toast.success(`Delegation ${rule.active ? "activated" : "deactivated"}`);
  return rule;
}

export function getActiveDelegation(
  delegatorId: string,
  moduleId?: string,
): DelegationRule | undefined {
  const today = new Date().toISOString().split("T")[0];
  return delegations.find((d) => {
    if (d.delegatorId !== delegatorId || !d.active) return false;
    if (d.startDate > today || d.endDate < today) return false;
    if (moduleId && d.moduleId && d.moduleId !== moduleId) return false;
    return true;
  });
}

// ============================================================
// Notifications
// ============================================================
export function markNotificationAsRead(notificationId: string): void {
  const notif = notifications.find((n) => n.id === notificationId);
  if (notif) {
    notif.read = true;
  }
}

export function markAllNotificationsAsRead(userId: string): void {
  notifications.forEach((n) => {
    if (n.recipientId === userId) n.read = true;
  });
}

// ============================================================
// Workflow Builder
// ============================================================
export function getWorkflows(): WorkflowConfig[] {
  return workflows;
}

export function getWorkflow(moduleId: string): WorkflowConfig | undefined {
  return workflows.find((w) => w.moduleId === moduleId);
}

export function getWorkflowById(id: string): WorkflowConfig | undefined {
  return workflows.find((w) => w.id === id);
}

export function createWorkflow(
  workflow: Omit<WorkflowConfig, "id" | "version" | "createdAt" | "updatedAt">,
): WorkflowConfig {
  const newWorkflow: WorkflowConfig = {
    ...workflow,
    id: `wf-${Date.now()}`,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  workflows.push(newWorkflow);
  toast.success("Workflow created");
  return newWorkflow;
}

export function updateWorkflow(
  id: string,
  updates: Partial<WorkflowConfig>,
): WorkflowConfig | null {
  const workflow = workflows.find((w) => w.id === id);
  if (!workflow) {
    toast.error("Workflow not found");
    return null;
  }
  Object.assign(workflow, updates);
  workflow.updatedAt = new Date().toISOString();
  workflow.version++;
  toast.success("Workflow updated");
  return workflow;
}

export function deleteWorkflow(id: string): boolean {
  const index = workflows.findIndex((w) => w.id === id);
  if (index === -1) {
    toast.error("Workflow not found");
    return false;
  }
  workflows.splice(index, 1);
  toast.success("Workflow deleted");
  return true;
}

export function duplicateWorkflow(id: string): WorkflowConfig | null {
  const source = workflows.find((w) => w.id === id);
  if (!source) return null;
  const duplicate: WorkflowConfig = {
    ...source,
    id: `wf-${Date.now()}`,
    name: `${source.name} (Copy)`,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  workflows.push(duplicate);
  toast.success("Workflow duplicated");
  return duplicate;
}

export function toggleWorkflow(id: string): WorkflowConfig | null {
  const workflow = workflows.find((w) => w.id === id);
  if (!workflow) return null;
  workflow.active = !workflow.active;
  workflow.updatedAt = new Date().toISOString();
  toast.success(`Workflow ${workflow.active ? "activated" : "deactivated"}`);
  return workflow;
}

export function reorderWorkflowSteps(
  workflowId: string,
  stepIds: string[],
): WorkflowConfig | null {
  const workflow = workflows.find((w) => w.id === workflowId);
  if (!workflow) return null;
  const reordered = stepIds
    .map((id, idx) => {
      const step = workflow.steps.find((s) => s.id === id);
      if (step) step.order = idx + 1;
      return step!;
    })
    .filter(Boolean);
  workflow.steps = reordered;
  workflow.updatedAt = new Date().toISOString();
  toast.success("Steps reordered");
  return workflow;
}

export function addWorkflowStep(
  workflowId: string,
  step: Omit<WorkflowStep, "id" | "order">,
): WorkflowConfig | null {
  const workflow = workflows.find((w) => w.id === workflowId);
  if (!workflow) return null;
  const newStep: WorkflowStep = {
    ...step,
    id: `ws-${Date.now()}`,
    order: workflow.steps.length + 1,
  };
  workflow.steps.push(newStep);
  workflow.updatedAt = new Date().toISOString();
  toast.success("Step added to workflow");
  return workflow;
}

export function removeWorkflowStep(workflowId: string, stepId: string): WorkflowConfig | null {
  const workflow = workflows.find((w) => w.id === workflowId);
  if (!workflow) return null;
  workflow.steps = workflow.steps.filter((s) => s.id !== stepId);
  // Reorder remaining steps
  workflow.steps.forEach((s, i) => (s.order = i + 1));
  workflow.updatedAt = new Date().toISOString();
  toast.success("Step removed from workflow");
  return workflow;
}

export function updateWorkflowStep(
  workflowId: string,
  stepId: string,
  updates: Partial<WorkflowStep>,
): WorkflowConfig | null {
  const workflow = workflows.find((w) => w.id === workflowId);
  if (!workflow) return null;
  const step = workflow.steps.find((s) => s.id === stepId);
  if (!step) return null;
  Object.assign(step, updates);
  workflow.updatedAt = new Date().toISOString();
  return workflow;
}

// ============================================================
// Queries
// ============================================================
export function getApprovalRequest(requestId: string): ApprovalRequest | undefined {
  return requests.find((r) => r.id === requestId);
}

export function getApprovalsForUser(
  userId: string,
  roleId: string,
): ApprovalRequest[] {
  // Check delegations - find requests where user is acting as delegate
  const activeDelegations = delegations.filter(
    (d) => d.delegateId === userId && d.active,
  );
  const delegatedIds = activeDelegations.map((d) => d.delegatorId);

  return requests.filter((req) => {
    if (req.status === "approved" || req.status === "rejected" || req.status === "cancelled")
      return false;
    const currentStep = req.steps[req.currentStepIndex];
    if (!currentStep || currentStep.status !== "current") return false;
    // Direct role match or delegated
    if (currentStep.role === roleId) return true;
    if (currentStep.actor === userId) return true;
    if (delegatedIds.includes(currentStep.actor || "")) return true;
    return false;
  });
}

export function getApprovalsByRole(roleId: string): ApprovalRequest[] {
  return requests.filter((req) => {
    if (req.status === "approved" || req.status === "rejected" || req.status === "cancelled")
      return false;
    const currentStep = req.steps[req.currentStepIndex];
    return currentStep && currentStep.role === roleId && currentStep.status === "current";
  });
}

export function getRequestsByUser(userId: string): ApprovalRequest[] {
  return requests.filter((r) => r.requesterId === userId);
}

export function getAllRequests(): ApprovalRequest[] {
  return requests;
}

export function getNotifications(userId: string): ApprovalNotification[] {
  return notifications.filter((n) => n.recipientId === userId);
}

export function getUnreadCount(userId: string): number {
  return notifications.filter((n) => n.recipientId === userId && !n.read).length;
}

export function getDelegations(): DelegationRule[] {
  return delegations;
}

export function getActionLogs(requestId?: string): ApprovalActionLog[] {
  if (requestId) return actionLogs.filter((l) => l.requestId === requestId);
  return actionLogs;
}

// ============================================================
// Approval Summaries
// ============================================================
export function getApprovalSummaries(
  userId: string,
  roleId: string,
): ApprovalSummary[] {
  return getApprovalsForUser(userId, roleId).map((req) => ({
    id: req.id,
    controlNumber: req.controlNumber,
    moduleId: req.moduleId,
    title: req.title,
    requesterName: req.requesterName,
    department: req.department,
    status: req.status,
    priority: req.priority,
    currentStepName: req.steps[req.currentStepIndex]?.name || "",
    currentStepRole: req.steps[req.currentStepIndex]?.role || roleId,
    createdAt: req.createdAt,
    updatedAt: req.updatedAt,
  }));
}

// ============================================================
// Control Number Generation
// ============================================================
export function generateControlNumber(moduleId: string): string {
  const config = CONTROL_NUMBERS.find((cn) => cn.moduleId === moduleId);
  if (!config) return `UNK-${Date.now()}`;

  const year = new Date().getFullYear();
  const sequence = String(config.sequence + 1).padStart(config.padding, "0");
  config.sequence++;

  return `${config.prefix}-${year}-${sequence}`;
}

export function getControlNumberConfigs() {
  return CONTROL_NUMBERS;
}

export function updateControlNumberConfig(
  moduleId: string,
  updates: Partial<typeof CONTROL_NUMBERS[0]>,
) {
  const config = CONTROL_NUMBERS.find((cn) => cn.moduleId === moduleId);
  if (!config) return null;
  Object.assign(config, updates);
  return config;
}

export function resetControlNumberSequence(moduleId: string): boolean {
  const config = CONTROL_NUMBERS.find((cn) => cn.moduleId === moduleId);
  if (!config) return false;
  config.sequence = 0;
  toast.success(`Control number sequence reset for ${config.prefix}`);
  return true;
}

// ============================================================
// Analytics & Metrics
// ============================================================
export function getApprovalMetrics(): ApprovalMetrics {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const allRequests = requests;

  const pendingApprovals = allRequests.filter(
    (r) => r.status === "pending" || r.status === "in_review",
  ).length;

  const approvedToday = allRequests.filter(
    (r) => r.status === "approved" && r.completedAt?.startsWith(today),
  ).length;

  const rejectedToday = allRequests.filter(
    (r) => r.status === "rejected" && r.completedAt?.startsWith(today),
  ).length;

  const totalApproved = allRequests.filter((r) => r.status === "approved").length;
  const totalRejected = allRequests.filter((r) => r.status === "rejected").length;
  const totalDecided = totalApproved + totalRejected;
  const approvalRate = totalDecided > 0 ? (totalApproved / totalDecided) * 100 : 0;

  // Average approval time (hours)
  const completedRequests = allRequests.filter(
    (r) => r.completedAt && (r.status === "approved" || r.status === "rejected"),
  );
  const totalHours = completedRequests.reduce((sum, r) => {
    const ms = new Date(r.completedAt!).getTime() - new Date(r.createdAt).getTime();
    return sum + ms / 3600000;
  }, 0);
  const averageApprovalTime =
    completedRequests.length > 0 ? totalHours / completedRequests.length : 0;

  // By module
  const byModule: Record<string, number> = {};
  allRequests.forEach((r) => {
    byModule[r.moduleId] = (byModule[r.moduleId] || 0) + 1;
  });

  // By priority
  const byPriority: Record<string, number> = {};
  allRequests.forEach((r) => {
    byPriority[r.priority] = (byPriority[r.priority] || 0) + 1;
  });

  // By department
  const byDepartment: Record<string, number> = {};
  allRequests.forEach((r) => {
    byDepartment[r.department] = (byDepartment[r.department] || 0) + 1;
  });

  // Monthly trend
  const monthlyTrend: { month: string; submitted: number; approved: number; rejected: number }[] =
    [];
  // Group by month
  const months: Record<string, { submitted: number; approved: number; rejected: number }> = {};
  allRequests.forEach((r) => {
    const month = r.createdAt.slice(0, 7); // YYYY-MM
    if (!months[month]) months[month] = { submitted: 0, approved: 0, rejected: 0 };
    months[month].submitted++;
    if (r.status === "approved") months[month].approved++;
    if (r.status === "rejected") months[month].rejected++;
  });
  Object.entries(months)
    .sort()
    .forEach(([month, data]) => {
      monthlyTrend.push({ month, ...data });
    });

  return {
    totalRequests: allRequests.length,
    pendingApprovals,
    approvedToday,
    rejectedToday,
    averageApprovalTime: Math.round(averageApprovalTime * 10) / 10,
    approvalRate: Math.round(approvalRate * 10) / 10,
    byModule,
    byPriority,
    byDepartment,
    monthlyTrend,
  };
}

export function getApproverPerformance(): ApproverPerformance[] {
  const performance: Record<string, ApproverPerformance> = {};

  actionLogs.forEach((log) => {
    if (!performance[log.actorId]) {
      performance[log.actorId] = {
        approverId: log.actorId,
        approverName: log.actorName,
        totalDecisions: 0,
        approved: 0,
        rejected: 0,
        averageDecisionTime: 0,
      };
    }
    performance[log.actorId].totalDecisions++;
    if (log.action === "approve") performance[log.actorId].approved++;
    if (log.action === "reject") performance[log.actorId].rejected++;
  });

  return Object.values(performance).sort((a, b) => b.totalDecisions - a.totalDecisions);
}

// ============================================================
// Escalation Check
// ============================================================
export function checkEscalations(): ApprovalRequest[] {
  const now = new Date();
  const escalated: ApprovalRequest[] = [];

  requests.forEach((req) => {
    if (req.status !== "in_review" && req.status !== "pending") return;
    const currentStep = req.steps[req.currentStepIndex];
    if (!currentStep || currentStep.status !== "current") return;

    // Check workflow escalation config
    const workflow = workflows.find((w) => w.id === req.workflowId);
    if (!workflow) return;

    const stepConfig = workflow.steps.find((s) => s.id === currentStep.stepId);
    if (!stepConfig?.escalationEnabled || !stepConfig.escalationHours) return;

    const stepStartDate = currentStep.date || req.createdAt;
    const elapsedHours =
      (now.getTime() - new Date(stepStartDate).getTime()) / 3600000;

    if (elapsedHours >= stepConfig.escalationHours && !currentStep.escalated) {
      currentStep.escalated = true;
      currentStep.escalatedAt = now.toISOString();
      currentStep.originalActor = currentStep.actor || "";
      currentStep.status = "escalated";

      // Add escalation notification
      createNotification({
        type: "escalated",
        title: "Approval escalated",
        message: `${req.controlNumber} has been escalated due to timeout`,
        requestId: req.id,
        controlNumber: req.controlNumber,
        moduleId: req.moduleId,
        recipientId: req.requesterId,
        actionUrl: `/app/m/${req.moduleId}`,
      });

      escalated.push(req);
    }
  });

  return escalated;
}

// ============================================================
// Create a new approval request (from any module)
// ============================================================
export function createApprovalRequest(
  data: Omit<ApprovalRequest, "id" | "controlNumber" | "status" | "createdAt" | "updatedAt" | "steps" | "currentStepIndex" | "stepInstances"> & {
    metadata?: Record<string, unknown>;
  },
): ApprovalRequest {
  const workflow = getWorkflow(data.moduleId);
  const controlNumber = generateControlNumber(data.moduleId);

  const steps: ApprovalStepInstance[] = (workflow?.steps || []).map((step, index) => ({
    stepId: step.id,
    name: step.name,
    role: step.role,
    order: step.order,
    required: step.required,
    status: index === 0 ? "current" : "pending",
    actor: index === 0 ? data.requesterId : undefined,
    actorName: index === 0 ? data.requesterName : undefined,
    date: index === 0 ? new Date().toISOString() : undefined,
    note: index === 0 ? "Submitted" : undefined,
    parallelApproval: step.parallelApproval,
    parallelRoles: step.parallelRoles,
  }));

  const newRequest: ApprovalRequest = {
    ...data,
    id: `apr-${Date.now()}`,
    controlNumber,
    status: steps.length > 1 ? "pending" : "approved",
    steps,
    currentStepIndex: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: steps.length <= 1 ? new Date().toISOString() : undefined,
  };

  requests.unshift(newRequest);

  // Notify first approver if not the requester
  if (steps.length > 1 && steps[1]) {
    const nextStep = steps[1];
    createNotification({
      type: "approval_required",
      title: "New approval request",
      message: `${controlNumber} - ${data.title} is waiting for ${nextStep.name} approval`,
      requestId: newRequest.id,
      controlNumber,
      moduleId: data.moduleId,
      recipientId: nextStep.actor || `${nextStep.role}-approver`,
      actionUrl: `/app/m/${data.moduleId}`,
    });
  }

  return newRequest;
}

// ============================================================
// Reset (for testing)
// ============================================================
export function resetEngine(): void {
  requests = [...APPROVAL_REQUESTS];
  notifications = [...APPROVAL_NOTIFICATIONS];
  delegations = [...DELEGATION_RULES];
  workflows = [...WORKFLOWS];
  actionLogs = [];
}

export function reloadRequests(): void {
  requests = [...APPROVAL_REQUESTS];
}

export function addRequest(request: ApprovalRequest): void {
  requests.push(request);
}