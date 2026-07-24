// Approval TanStack Query Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { approvalApi } from './approval-api';
import { useAuth } from '@/contexts/AuthContext';

export function useApprovalRequests(filters?: {
  status?: string;
  moduleId?: string;
  page?: number;
  pageSize?: number;
}) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['approval-requests', user?.id, filters],
    queryFn: () => approvalApi.getAll(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
    enabled: !!user?.id, // Only fetch when user is authenticated
  });
}

export function useApprovalRequest(id: string) {
  return useQuery({
    queryKey: ['approval-requests', id],
    queryFn: () => approvalApi.getById(id),
    enabled: !!id,
  });
}

export function usePendingApprovals(userId: string) {
  return useQuery({
    queryKey: ['approval-requests', 'pending', userId],
    queryFn: () => approvalApi.getPendingForUser(userId),
    staleTime: 1000 * 60 * 1, // 1 minute
  });
}

export function useApprovalsByRole(roleId: string) {
  return useQuery({
    queryKey: ['approval-requests', 'role', roleId],
    queryFn: () => approvalApi.getByRole(roleId),
    staleTime: 1000 * 60 * 1, // 1 minute
  });
}

export function useWorkflows() {
  return useQuery({
    queryKey: ['workflows'],
    queryFn: () => approvalApi.getWorkflows(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useWorkflowByModule(moduleId: string) {
  return useQuery({
    queryKey: ['workflows', 'module', moduleId],
    queryFn: () => approvalApi.getWorkflowByModule(moduleId),
    enabled: !!moduleId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useDelegations() {
  return useQuery({
    queryKey: ['delegations'],
    queryFn: () => approvalApi.getDelegations(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useApprovalMetrics() {
  return useQuery({
    queryKey: ['approval-requests', 'metrics'],
    queryFn: () => approvalApi.getMetrics(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useApproverPerformance() {
  return useQuery({
    queryKey: ['approval-requests', 'performance'],
    queryFn: () => approvalApi.getApproverPerformance(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useApproveRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: { note?: string; signature?: File } }) =>
      approvalApi.approve(requestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useRejectRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: { reason: string; signature?: File } }) =>
      approvalApi.reject(requestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useReturnRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: { note: string } }) =>
      approvalApi.returnRequest(requestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useDelegateRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: { delegateId: string; note?: string } }) =>
      approvalApi.delegate(requestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
      queryClient.invalidateQueries({ queryKey: ['delegations'] });
    },
  });
}

export function useRecallRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (requestId: string) => approvalApi.recall(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (workflow: Parameters<typeof approvalApi.createWorkflow>[0]) =>
      approvalApi.createWorkflow(workflow),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });
}

export function useUpdateWorkflow() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof approvalApi.updateWorkflow>[1] }) =>
      approvalApi.updateWorkflow(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => approvalApi.deleteWorkflow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });
}

export function useCreateDelegation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (delegation: Parameters<typeof approvalApi.createDelegation>[0]) =>
      approvalApi.createDelegation(delegation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delegations'] });
    },
  });
}

export function useUpdateDelegation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof approvalApi.updateDelegation>[1] }) =>
      approvalApi.updateDelegation(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delegations'] });
    },
  });
}

export function useDeleteDelegation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => approvalApi.deleteDelegation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delegations'] });
    },
  });
}

export function useToggleDelegation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => approvalApi.toggleDelegation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delegations'] });
    },
  });
}