// Employee TanStack Query Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeApi } from './employee-api';

export function useEmployees(filters?: {
  departmentId?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ['employees', filters],
    queryFn: () => employeeApi.getAll(filters),
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: ['employees', id],
    queryFn: () => employeeApi.getById(id),
    enabled: !!id,
  });
}

export function useEmployeeByNumber(employeeNumber: string) {
  return useQuery({
    queryKey: ['employees', 'number', employeeNumber],
    queryFn: () => employeeApi.getByEmployeeNumber(employeeNumber),
    enabled: !!employeeNumber,
  });
}

export function useEmployeesByDepartment(departmentId: string) {
  return useQuery({
    queryKey: ['employees', 'department', departmentId],
    queryFn: () => employeeApi.getByDepartment(departmentId),
    enabled: !!departmentId,
  });
}

export function useSubordinates(supervisorId: string) {
  return useQuery({
    queryKey: ['employees', 'subordinates', supervisorId],
    queryFn: () => employeeApi.getSubordinates(supervisorId),
    enabled: !!supervisorId,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Parameters<typeof employeeApi.create>[0]) => employeeApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof employeeApi.update>[1] }) =>
      employeeApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => employeeApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useUpdateEmployeeStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      employeeApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}