// Approval API Service - Real backend integration
import { fetchApi } from './api-client';

export interface ApprovalRequest {
  id: string;
  controlNumber: string;
  moduleId: string;
  title: string;
  description?: string;
  requesterId: string;
  requesterName?: string;
  department?: string;
  status: string;
  priority: string;
  workflowId?: string;
  currentStepIndex: number;
  createdAt: string;
  updatedAt: string;
  steps: ApprovalStep[];
}

export interface ApprovalStep {
  stepId?: string;
  name: string;
  role: string;
  order: number;
  required: boolean;
  status: string;
  actor?: string;
  actorName?: string;
  date?: string;
  note?: string;
}

export interface ApprovalAction {
  id: string;
  action: string;
  actorId: string;
  actorName?: string;
  note?: string;
  signaturePath?: string;
  createdAt: string;
}

export interface WorkflowConfig {
  id: string;
  moduleId: string;
  name: string;
  description?: string;
  active: boolean;
  version: number;
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  id: string;
  name: string;
  role: string;
  order: number;
  required: boolean;
  label?: string;
}

export interface DelegationRule {
  id: string;
  delegatorId: string;
  delegatorName?: string;
  delegateId: string;
  delegateName?: string;
  moduleId?: string;
  startDate: string;
  endDate: string;
  active: boolean;
  reason?: string;
}

export interface ApprovalMetrics {
  totalRequests: number;
  pendingApprovals: number;
  approvedToday: number;
  rejectedToday: number;
  averageApprovalTime: number;
  approvalRate: number;
  byModule: Record<string, number>;
  byPriority: Record<string, number>;
  byDepartment: Record<string, number>;
  monthlyTrend: Array<{
    month: string;
    submitted: number;
    approved: number;
    rejected: number;
  }>;
}

export interface ApproverPerformance {
  approverId: string;
  approverName: string;
  totalDecisions: number;
  approved: number;
  rejected: number;
  averageDecisionTime: number;
}

export const approvalApi = {
  // Approval Requests
  async getAll(filters?: {
    status?: string;
    moduleId?: string;
    requesterId?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ data: ApprovalRequest[]; total: number; page: number; pageSize: number }> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.moduleId) params.append('moduleId', filters.moduleId);
    if (filters?.requesterId) params.append('requesterId', filters.requesterId);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.pageSize) params.append('pageSize', String(filters.pageSize));
    
    const query = params.toString();
    return fetchApi<{ data: ApprovalRequest[]; total: number; page: number; pageSize: number }>(
      `/approval-requests${query ? `?${query}` : ''}`
    );
  },

  async getById(id: string): Promise<ApprovalRequest> {
    return fetchApi<ApprovalRequest>(`/approval-requests/${id}`);
  },

  async getByControlNumber(controlNumber: string): Promise<ApprovalRequest> {
    return fetchApi<ApprovalRequest>(`/approval-requests/control/${controlNumber}`);
  },

  async getPendingForUser(userId: string): Promise<ApprovalRequest[]> {
    return fetchApi<ApprovalRequest[]>(`/approval-requests/pending/${userId}`);
  },

  async getByRole(roleId: string): Promise<ApprovalRequest[]> {
    return fetchApi<ApprovalRequest[]>(`/approval-requests/role/${roleId}`);
  },

  // Actions
  async approve(requestId: string, data: { note?: string; signature?: File }): Promise<any> {
    const formData = new FormData();
    formData.append('requestId', requestId);
    if (data.note) formData.append('note', data.note);
    if (data.signature) formData.append('signature', data.signature);

    const accessToken = localStorage.getItem('hst.auth.accessToken');
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'}/approval-requests/${requestId}/approve`, {
      method: 'POST',
      body: formData,
      headers: {
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  },

  async reject(requestId: string, data: { reason: string; signature?: File }): Promise<any> {
    const formData = new FormData();
    formData.append('requestId', requestId);
    formData.append('reason', data.reason);
    if (data.signature) formData.append('signature', data.signature);

    const accessToken = localStorage.getItem('hst.auth.accessToken');
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'}/approval-requests/${requestId}/reject`, {
      method: 'POST',
      body: formData,
      headers: {
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  },

  async returnRequest(requestId: string, data: { note: string }): Promise<any> {
    return fetchApi<any>(`/approval-requests/${requestId}/return`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async delegate(requestId: string, data: { delegateId: string; note?: string }): Promise<any> {
    return fetchApi<any>(`/approval-requests/${requestId}/delegate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async recall(requestId: string): Promise<any> {
    return fetchApi<any>(`/approval-requests/${requestId}/recall`, {
      method: 'POST',
    });
  },

  // Workflows
  async getWorkflows(): Promise<WorkflowConfig[]> {
    return fetchApi<WorkflowConfig[]>('/workflows');
  },

  async getWorkflowByModule(moduleId: string): Promise<WorkflowConfig | null> {
    return fetchApi<WorkflowConfig | null>(`/workflows/module/${moduleId}`);
  },

  async createWorkflow(workflow: Omit<WorkflowConfig, 'id' | 'version'>): Promise<WorkflowConfig> {
    return fetchApi<WorkflowConfig>('/workflows', {
      method: 'POST',
      body: JSON.stringify(workflow),
    });
  },

  async updateWorkflow(id: string, updates: Partial<WorkflowConfig>): Promise<WorkflowConfig> {
    return fetchApi<WorkflowConfig>(`/workflows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteWorkflow(id: string): Promise<void> {
    return fetchApi<void>(`/workflows/${id}`, {
      method: 'DELETE',
    });
  },

  // Delegations
  async getDelegations(): Promise<DelegationRule[]> {
    return fetchApi<DelegationRule[]>('/delegations');
  },

  async createDelegation(delegation: Omit<DelegationRule, 'id' | 'createdAt'>): Promise<DelegationRule> {
    return fetchApi<DelegationRule>('/delegations', {
      method: 'POST',
      body: JSON.stringify(delegation),
    });
  },

  async updateDelegation(id: string, updates: Partial<DelegationRule>): Promise<DelegationRule> {
    return fetchApi<DelegationRule>(`/delegations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteDelegation(id: string): Promise<void> {
    return fetchApi<void>(`/delegations/${id}`, {
      method: 'DELETE',
    });
  },

  async toggleDelegation(id: string): Promise<DelegationRule> {
    return fetchApi<DelegationRule>(`/delegations/${id}/toggle`, {
      method: 'POST',
    });
  },

  // Metrics & Analytics
  async getMetrics(): Promise<ApprovalMetrics> {
    return fetchApi<ApprovalMetrics>('/approval-requests/metrics');
  },

  async getApproverPerformance(): Promise<ApproverPerformance[]> {
    return fetchApi<ApproverPerformance[]>('/approval-requests/performance');
  },

  async getActionLogs(requestId?: string): Promise<ApprovalAction[]> {
    const query = requestId ? `?requestId=${requestId}` : '';
    return fetchApi<ApprovalAction[]>(`/approval-actions${query}`);
  },
};