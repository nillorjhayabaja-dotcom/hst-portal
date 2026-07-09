// Approval Engine Service - Universal approval workflow logic
import { toast } from "sonner";
import type { ApprovalRequest, ApprovalStepInstance, ApprovalAction, DelegationRule, WorkflowConfig, ApprovalNotification } from "@/types/approval";
import { APPROVAL_REQUESTS, APPROVAL_NOTIFICATIONS, DELEGATION_RULES, WORKFLOWS, CONTROL_NUMBERS } from "@/mock/approval-engine";

// ============================================================
// In-memory state (mock database)
// ============================================================
let requests = [...APPROVAL_REQUESTS];
let notifications = [...APPROVAL_NOTIFICATIONS];
let delegations = [...DELEGATION_RULES];

// ============================================================
// Approval Actions
// ============================================================
export function approveRequest(requestId: string, actorId: string, actorName: string, note?: string): ApprovalRequest | null {
  const req = requests.find((r) => r.id === requestId);
  if (!req) return null;

  const currentStep = req.steps[req.currentStepIndex];
  if (!currentStep || currentStep.status !== "current") return null;

  // Mark current step as approved
  currentStep.status = "approved";
  currentStep.actor = actorId;
  currentStep.actorName = actorName;
  currentStep.date = new Date().toISOString();
  currentStep.note = note;

  // Move to next step or complete
  if (req.currentStepIndex < req.steps.length - 1) {
    req.currentStepIndex++;
    req.steps[req.currentStepIndex].status = "current";
    req.status = "in_review";
    
    // Notify next approver
    const nextStep = req.steps[req.currentStepIndex];
    createNotification({
      type: "approval_required",
      title: "Approval required",
      message: `${req.controlNumber} is waiting for your approval`,
      requestId: req.id,
      controlNumber: req.controlNumber,
      moduleId: req.moduleId,
      recipientId: nextStep.actor || "next-approver",
    });
    
    toast.success("Request approved and forwarded to next approver");
  } else {
    // All steps approved
    req.status = "approved";
    req.completedAt = new Date().toISOString();
    
    createNotification({
      type: "approved",
      title: "Request approved",
      message: `${req.controlNumber} has been fully approved`,
      requestId: req.id,
      controlNumber: req.controlNumber,
      moduleId: req.moduleId,
      recipientId: req.requesterId,
    });
    
    toast.success("Request fully approved");
  }

  req.updatedAt = new Date().toISOString();
  return req;
}

export function rejectRequest(requestId: string, actorId: string, actorName: string, reason: string): ApprovalRequest | null {
  const req = requests.find((r) => r.id === requestId);
  if (!req) return null;

  const currentStep = req.steps[req.currentStepIndex];
  if (!currentStep || currentStep.status !== "current") return null;

  currentStep.status = "rejected";
  currentStep.actor = actorId;
  currentStep.actorName = actorName;
  currentStep.date = new Date().toISOString();
  currentStep.note = reason;

  req.status = "rejected";
  req.updatedAt = new Date().toISOString();

  createNotification({
    type: "rejected",
    title: "Request rejected",
    message: `${req.controlNumber} was rejected: ${reason}`,
    requestId: req.id,
    controlNumber: req.controlNumber,
    moduleId: req.moduleId,
    recipientId: req.requesterId,
  });

  toast.error("Request rejected");
  return req;
}

export function returnRequest(requestId: string, actorId: string, actorName: string, note: string): ApprovalRequest | null {
  const req = requests.find((r) => r.id === requestId);
  if (!req) return null;

  const currentStep = req.steps[req.currentStepIndex];
  if (!currentStep || currentStep.status !== "current") return null;

  currentStep.status = "rejected";
  currentStep.actor = actorId;
  currentStep.actorName = actorName;
  currentStep.date = new Date().toISOString();
  currentStep.note = note;

  // Return to previous step
  if (req.currentStepIndex > 0) {
    req.currentStepIndex--;
    req.steps[req.currentStepIndex].status = "current";
    req.status = "returned";
  } else {
    req.status = "returned";
  }

  req.updatedAt = new Date().toISOString();

  createNotification({
    type: "returned",
    title: "Request returned",
    message: `${req.controlNumber} was returned for revision: ${note}`,
    requestId: req.id,
    controlNumber: req.controlNumber,
    moduleId: req.moduleId,
    recipientId: req.requesterId,
  });

  toast.warning("Request returned for revision");
  return req;
}

// ============================================================
// Delegation
// ============================================================
export function createDelegation(rule: Omit<DelegationRule, "id" | "createdAt">): DelegationRule {
  const newRule: DelegationRule = {
    ...rule,
    id: `del-${Date.now()}`,
    createdAt: new Date().toISOString().split("T")[0],
  };
  delegations.push(newRule);
  toast.success("Delegation rule created");
  return newRule;
}

export function getActiveDelegation(delegatorId: string, moduleId?: string): DelegationRule | undefined {
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
function createNotification(data: Omit<ApprovalNotification, "id" | "createdAt" | "read">): ApprovalNotification {
  const notification: ApprovalNotification = {
    ...data,
    id: `notif-${Date.now()}`,
    read: false,
    createdAt: new Date().toISOString(),
  };
  notifications.push(notification);
  return notification;
}

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
  toast.success("All notifications marked as read");
}

// ============================================================
// Queries
// ============================================================
export function getApprovalRequest(requestId: string): ApprovalRequest | undefined {
  return requests.find((r) => r.id === requestId);
}

export function getApprovalsForUser(userId: string, roleId: string): ApprovalRequest[] {
  return requests.filter((req) => {
    if (req.status === "approved" || req.status === "rejected" || req.status === "cancelled") return false;
    const currentStep = req.steps[req.currentStepIndex];
    return currentStep && currentStep.role === roleId && currentStep.status === "current";
  });
}

export function getRequestsByUser(userId: string): ApprovalRequest[] {
  return requests.filter((r) => r.requesterId === userId);
}

export function getWorkflow(moduleId: string): WorkflowConfig | undefined {
  return WORKFLOWS.find((w) => w.moduleId === moduleId);
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

// ============================================================
// Control Number Generation
// ============================================================
export function generateControlNumber(moduleId: string): string {
  const config = CONTROL_NUMBERS.find((cn) => cn.moduleId === moduleId);
  if (!config) return `UNK-${Date.now()}`;

  const year = new Date().getFullYear();
  const sequence = String(config.sequence + 1).padStart(config.padding, "0");
  
  // Update sequence (mock)
  config.sequence++;
  
  return `${config.prefix}-${year}-${sequence}`;
}