// Search TanStack Query Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { searchApi } from './search-api';

export function useSearch(filters: {
  query: string;
  types?: string[];
  departmentId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ['search', filters],
    queryFn: () => searchApi.search(filters),
    enabled: !!filters.query,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useSearchEmployees(query: string, filters?: { departmentId?: string; status?: string }) {
  return useQuery({
    queryKey: ['search', 'employees', query, filters],
    queryFn: () => searchApi.searchEmployees(query, filters),
    enabled: !!query,
    staleTime: 1000 * 60 * 2,
  });
}

export function useSearchRequests(query: string, filters?: { moduleId?: string; status?: string }) {
  return useQuery({
    queryKey: ['search', 'requests', query, filters],
    queryFn: () => searchApi.searchRequests(query, filters),
    enabled: !!query,
    staleTime: 1000 * 60 * 2,
  });
}

export function useSearchDepartments(query: string) {
  return useQuery({
    queryKey: ['search', 'departments', query],
    queryFn: () => searchApi.searchDepartments(query),
    enabled: !!query,
    staleTime: 1000 * 60 * 5,
  });
}

export function useRecentSearches(userId: string, limit: number = 10) {
  return useQuery({
    queryKey: ['search', 'recent', userId, limit],
    queryFn: () => searchApi.getRecentSearches(userId, limit),
    staleTime: 1000 * 60 * 5,
    enabled: !!userId,
  });
}

export function usePopularSearches(limit: number = 10) {
  return useQuery({
    queryKey: ['search', 'popular', limit],
    queryFn: () => searchApi.getPopularSearches(limit),
    staleTime: 1000 * 60 * 10,
  });
}

export function useSaveSearch() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, query, type }: { userId: string; query: string; type: string }) =>
      searchApi.saveSearch(userId, query, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search'] });
    },
  });
}