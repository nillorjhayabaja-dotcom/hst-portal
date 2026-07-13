// Dashboard TanStack Query Hooks
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { dashboardApi } from './dashboard-api';

export function useDashboardOverview() {
  return useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: () => dashboardApi.getOverview(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: () => dashboardApi.getMetrics(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useDashboardCharts() {
  return useQuery({
    queryKey: ['dashboard', 'charts'],
    queryFn: () => dashboardApi.getCharts(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useDashboardKPIs() {
  return useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: () => dashboardApi.getKPIs(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Hook to refresh all dashboard data
export function useRefreshDashboard() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
  };
}