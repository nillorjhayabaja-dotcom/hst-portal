// Configuration TanStack Query Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { configApi } from './config-api';

export function useCompanyProfile() {
  return useQuery({
    queryKey: ['config', 'company'],
    queryFn: () => configApi.getCompanyProfile(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ['config', 'departments'],
    queryFn: () => configApi.getDepartments(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useDepartment(id: string) {
  return useQuery({
    queryKey: ['config', 'departments', id],
    queryFn: () => configApi.getDepartmentById(id),
    enabled: !!id,
  });
}

export function usePositions() {
  return useQuery({
    queryKey: ['config', 'positions'],
    queryFn: () => configApi.getPositions(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function usePosition(id: string) {
  return useQuery({
    queryKey: ['config', 'positions', id],
    queryFn: () => configApi.getPositionById(id),
    enabled: !!id,
  });
}

export function useSettings(category?: string) {
  return useQuery({
    queryKey: ['config', 'settings', category],
    queryFn: () => configApi.getSettings(category),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useHolidays(year?: number) {
  return useQuery({
    queryKey: ['config', 'holidays', year],
    queryFn: () => configApi.getHolidays(year),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useBusinessRules(moduleId?: string) {
  return useQuery({
    queryKey: ['config', 'business-rules', moduleId],
    queryFn: () => configApi.getBusinessRules(moduleId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpdateCompanyProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Parameters<typeof configApi.updateCompanyProfile>[0]) =>
      configApi.updateCompanyProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'company'] });
    },
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Parameters<typeof configApi.createDepartment>[0]) =>
      configApi.createDepartment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'departments'] });
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof configApi.updateDepartment>[1] }) =>
      configApi.updateDepartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'departments'] });
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => configApi.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'departments'] });
    },
  });
}

export function useCreatePosition() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Parameters<typeof configApi.createPosition>[0]) =>
      configApi.createPosition(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'positions'] });
    },
  });
}

export function useUpdatePosition() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof configApi.updatePosition>[1] }) =>
      configApi.updatePosition(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'positions'] });
    },
  });
}

export function useDeletePosition() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => configApi.deletePosition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'positions'] });
    },
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      configApi.updateSetting(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'settings'] });
    },
  });
}

export function useCreateHoliday() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Parameters<typeof configApi.createHoliday>[0]) =>
      configApi.createHoliday(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'holidays'] });
    },
  });
}

export function useUpdateHoliday() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof configApi.updateHoliday>[1] }) =>
      configApi.updateHoliday(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'holidays'] });
    },
  });
}

export function useDeleteHoliday() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => configApi.deleteHoliday(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'holidays'] });
    },
  });
}

export function useCreateBusinessRule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Parameters<typeof configApi.createBusinessRule>[0]) =>
      configApi.createBusinessRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'business-rules'] });
    },
  });
}

export function useUpdateBusinessRule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof configApi.updateBusinessRule>[1] }) =>
      configApi.updateBusinessRule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'business-rules'] });
    },
  });
}

export function useDeleteBusinessRule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => configApi.deleteBusinessRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'business-rules'] });
    },
  });
}

export function useToggleBusinessRule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => configApi.toggleBusinessRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'business-rules'] });
    },
  });
}