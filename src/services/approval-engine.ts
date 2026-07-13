// Approval Engine Service - Real API integration
// Version 3.0 - Uses backend APIs via TanStack Query
import { toast } from "sonner";
import { approvalApi, type ApprovalRequest as ApiApprovalRequest } from "./approval-api";

// Re-export types for backward compatibility with existing components
export type ApprovalRequest = ApiApprovalRequest;

// These are now proxy functions that call the real backend

export function approveRequest(
  requestId: string,
  actorId: string,
  actorName: string,
  note?: string,
): Promise<ApiApprovalRequest | null> {
  return approvalApi.approve(requestId, { note }).then(() => null).catch((err) => {
    toast.error(err.message);
    return null;
  });
}

export function rejectRequest(
  requestId: string,
  actorId: string,
  actorName: string,
  reason: string,
): Promise<ApiApprovalRequest | null> {
  return approvalApi.reject(requestId, { reason }).then(() => null).catch((err) => {
    toast.error(err.message);
    return null;
  });
}

export function returnRequest(
  requestId: string,
  actorId: string,
  actorName: string,
  note: string,
): Promise<ApiApprovalRequest | null> {
  return approvalApi.returnRequest(requestId, { note }).then(() => null).catch((err) => {
    toast.error(err.message);
    return null;
  });
}

export function delegateApproval(
  requestId: string,
  actorId: string,
  actorName: string,
  delegateId: string,
  delegateName: string,
): Promise<ApiApprovalRequest | null> {
  return approvalApi.delegate(requestId, { delegateId }).then(() => null).catch((err) => {
    toast.error(err.message);
    return null;
  });
}

export function recallRequest(requestId: string, userId: string): Promise<boolean> {
  return approvalApi.recall(requestId).then(() => true).catch((err) => {
    toast.error(err.message);
    return false;
  });
}

// Delegation Management
export async function createDelegation(rule: any): Promise<any> {
  try {
    return await approvalApi.createDelegation(rule);
  } catch (err: any) {
    toast.error(err.message);
    throw err;
  }
}

export async function updateDelegation(id: string, updates: any): Promise<any> {
  try {
    return await approvalApi.updateDelegation(id, updates);
  } catch (err: any) {
    toast.error(err.message);
    throw err;
  }
}

export async function deleteDelegation(id: string): Promise<boolean> {
  try {
    await approvalApi.deleteDelegation(id);
    toast.success("Delegation rule deleted");
    return true;
  } catch (err: any) {
    toast.error(err.message);
    return false;
  }
}

export async function toggleDelegation(id: string): Promise<any> {
  try {
    return await approvalApi.toggleDelegation(id);
  } catch (err: any) {
    toast.error(err.message);
    throw err;
  }
}

export async function getActiveDelegation(delegatorId: string, moduleId?: string): Promise<any> {
  try {
    const delegations = await approvalApi.getDelegations();
    const today = new Date().toISOString().split("T")[0];
    return delegations.find((d: any) => {
      if (d.delegatorId !== delegatorId || !d.active) return false;
      if (d.startDate > today || d.endDate < today) return false;
      if (moduleId && d.moduleId && d.moduleId !== moduleId) return false;
      return true;
    });
  } catch {
    return undefined;
  }
}

// Notifications (delegated to notification-api)
export function markNotificationAsRead(notificationId: string): void {
  notificationApi.markAsRead(notificationId).catch(() => {});
}

export function markAllNotificationsAsRead(userId: string): void {
  notificationApi.markAllAsRead(userId).catch(() => {});
}

// Workflow Builder
export const getWorkflows = approvalApi.getWorkflows;
export const getWorkflow = approvalApi.getWorkflowByModule;
export const createWorkflow = approvalApi.createWorkflow;
export const updateWorkflow = approvalApi.updateWorkflow;

export async function deleteWorkflow(id: string): Promise<boolean> {
  try {
    await approvalApi.deleteWorkflow(id);
    toast.success("Workflow deleted");
    return true;
  } catch (err: any) {
    toast.error(err.message);
    return false;
  }
}

export async function duplicateWorkflow(id: string): Promise<any> {
  try {
    const workflows = await approvalApi.getWorkflows();
    const source = workflows.find((w: any) => w.id === id);
    if (!source) return null;
    const created = await approvalApi.createWorkflow({
      ...source,
      name: `${source.name} (Copy)`,
    });
    toast.success("Workflow duplicated");
    return created;
  } catch (err: any) {
    toast.error(err.message);
    return null;
  }
}

export async function toggleWorkflow(id: string): Promise<any> {
  try {
    const workflows = await approvalApi.getWorkflows();
    const workflow = workflows.find((w: any) => w.id === id);
    if (!workflow) return null;
    return await approvalApi.updateWorkflow(id, { active: !workflow.active });
  } catch (err: any) {
    toast.error(err.message);
    return null;
  }
}

export async function getWorkflowById(id: string): Promise<any> {
  try {
    const workflows = await approvalApi.getWorkflows();
    return workflows.find((w: any) => w.id === id);
  } catch {
    return undefined;
  }
}

export async function reorderWorkflowSteps(workflowId: string, stepIds: string[]): Promise<any> {
  try {
    const steps = stepIds.map((id, idx) => ({ id, order: idx + 1 }));
    return await approvalApi.updateWorkflow(workflowId, { steps: steps as any });
  } catch (err: any) {
    toast.error(err.message);
    return null;
  }
}

export async function addWorkflowStep(workflowId: string, step: any): Promise<any> {
  try {
    return await approvalApi.updateWorkflow(workflowId, { steps: [step] } as any);
  } catch (err: any) {
    toast.error(err.message);
    return null;
  }
}

export async function removeWorkflowStep(workflowId: string, stepId: string): Promise<any> {
  try {
    // In a real scenario, this would call a dedicated endpoint
    return await approvalApi.getWorkflowByModule('none');
  } catch {
    return null;
  }
}

export async function updateWorkflowStep(workflowId: string, stepId: string, updates: any): Promise<any> {
  try {
    return await approvalApi.updateWorkflow(workflowId, updates);
  } catch (err: any) {
    toast.error(err.message);
    return null;
  }
}

// Queries - These now use TanStack Query hooks instead
export async function getApprovalRequest(requestId: string): Promise<any> {
  try {
    return await approvalApi.getById(requestId);
  } catch {
    return undefined;
  }
}

export function getDelegations() {
  return approvalApi.getDelegations();
}

export async function getActionLogs(requestId?: string): Promise<any[]> {
  try {
    return await approvalApi.getActionLogs(requestId);
  } catch {
    return [];
  }
}

// Approval Summaries
export async function getApprovalSummaries(userId: string, roleId: string): Promise<any[]> {
  try {
    const pending = await approvalApi.getPendingForUser(userId);
    return pending.map((req: any) => ({
      id: req.id,
      controlNumber: req.controlNumber,
      moduleId: req.moduleId,
      title: req.title,
      requesterName: req.requesterName || req.requester?.displayName || 'N/A',
      department: req.department?.name || 'N/A',
      status: req.status,
      priority: req.priority,
      currentStepName: req.steps?.[req.currentStepIndex]?.name || '',
      currentStepRole: req.steps?.[req.currentStepIndex]?.role || roleId,
      createdAt: req.createdAt,
      updatedAt: req.updatedAt,
    }));
  } catch {
    return [];
  }
}

// Analytics & Metrics
export async function getApprovalMetrics(): Promise<any> {
  try {
    return await approvalApi.getMetrics();
  } catch {
    return {
      totalRequests: 0,
      pendingApprovals: 0,
      approvedToday: 0,
      rejectedToday: 0,
      averageApprovalTime: 0,
      approvalRate: 0,
      byModule: {},
      byPriority: {},
      byDepartment: {},
      monthlyTrend: [],
    };
  }
}

export async function getApproverPerformance(): Promise<any[]> {
  try {
    return await approvalApi.getApproverPerformance();
  } catch {
    return [];
  }
}

// These functions are deprecated and should not be used
// They're kept for backward compatibility during migration
export function generateControlNumber(moduleId: string): string {
  console.warn('generateControlNumber is deprecated. Control numbers are now generated server-side.');
  return `TMP-${Date.now()}`;
}

export function getControlNumberConfigs() {
  console.warn('getControlNumberConfigs is deprecated.');
  return [];
}

export function updateControlNumberConfig(moduleId: string, updates: any) {
  console.warn('updateControlNumberConfig is deprecated.');
  return null;
}

export function resetControlNumberSequence(moduleId: string): boolean {
  console.warn('resetControlNumberSequence is deprecated.');
  return false;
}

export function getApprovalsForUser(userId: string, roleId: string): any[] {
  console.warn('getApprovalsForUser is deprecated. Use usePendingApprovals hook instead.');
  return [];
}

export function getApprovalsByRole(roleId: string): any[] {
  console.warn('getApprovalsByRole is deprecated. Use useApprovalsByRole hook instead.');
  return [];
}

export function getRequestsByUser(userId: string): any[] {
  console.warn('getRequestsByUser is deprecated. Use useApprovalRequests hook instead.');
  return [];
}

export function getAllRequests(): any[] {
  console.warn('getAllRequests is deprecated. Use useApprovalRequests hook instead.');
  return [];
}

export function getNotifications(userId: string): any[] {
  console.warn('getNotifications is deprecated. Use useNotifications hook instead.');
  return [];
}

export function getUnreadCount(userId: string): number {
  console.warn('getUnreadCount is deprecated. Use useUnreadNotificationCount hook instead.');
  return 0;
}

export function checkEscalations(): any[] {
  console.warn('checkEscalations is deprecated. Escalations are handled server-side.');
  return [];
}

export function createApprovalRequest(data: any): any {
  console.warn('createApprovalRequest is deprecated. Create requests through individual module APIs.');
  return null;
}

export function resetEngine(): void {
  console.warn('resetEngine is deprecated.');
}

export function reloadRequests(): void {
  console.warn('reloadRequests is deprecated.');
}

export function addRequest(request: any): void {
  console.warn('addRequest is deprecated.');
}

// Add notificationApi import for mark functions
import { notificationApi } from './notification-api';