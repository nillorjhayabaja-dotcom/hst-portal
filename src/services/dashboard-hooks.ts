// Dashboard TanStack Query Hooks
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { dashboardApi } from './dashboard-api';
import { useAuth } from '@/contexts/AuthContext';

export function useDashboardOverview() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['dashboard', 'overview', user?.id],
    queryFn: () => dashboardApi.getOverview(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    enabled: !!user?.id, // Only fetch when user is authenticated
  });
}

export function useDashboardMetrics() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['dashboard', 'metrics', user?.id],
    queryFn: () => dashboardApi.getMetrics(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    enabled: !!user?.id, // Only fetch when user is authenticated
  });
}

export function useDashboardCharts() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['dashboard', 'charts', user?.id],
    queryFn: () => dashboardApi.getCharts(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!user?.id, // Only fetch when user is authenticated
  });
}

export function useDashboardKPIs() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['dashboard', 'kpis', user?.id],
    queryFn: () => dashboardApi.getKPIs(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    enabled: !!user?.id, // Only fetch when user is authenticated
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