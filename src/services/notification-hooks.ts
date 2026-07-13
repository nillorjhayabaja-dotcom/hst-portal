// Notification TanStack Query Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from './notification-api';

export function useNotifications(filters?: {
  isRead?: boolean;
  moduleId?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ['notifications', filters],
    queryFn: () => notificationApi.getAll(filters),
    staleTime: 1000 * 60 * 1, // 1 minute
  });
}

export function useNotification(id: string) {
  return useQuery({
    queryKey: ['notifications', id],
    queryFn: () => notificationApi.getById(id),
    enabled: !!id,
  });
}

export function useUnreadNotificationCount(userId: string) {
  return useQuery({
    queryKey: ['notifications', 'unread', userId],
    queryFn: () => notificationApi.getUnreadCount(userId),
    staleTime: 1000 * 30, // 30 seconds
    enabled: !!userId,
  });
}

export function useNotificationRules() {
  return useQuery({
    queryKey: ['notification-rules'],
    queryFn: () => notificationApi.getRules(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) => notificationApi.markAllAsRead(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => notificationApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useDeleteAllNotifications() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) => notificationApi.deleteAll(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useCreateNotificationRule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (rule: Parameters<typeof notificationApi.createRule>[0]) =>
      notificationApi.createRule(rule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-rules'] });
    },
  });
}

export function useUpdateNotificationRule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof notificationApi.updateRule>[1] }) =>
      notificationApi.updateRule(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-rules'] });
    },
  });
}

export function useDeleteNotificationRule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => notificationApi.deleteRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-rules'] });
    },
  });
}

export function useToggleNotificationRule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => notificationApi.toggleRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-rules'] });
    },
  });
}