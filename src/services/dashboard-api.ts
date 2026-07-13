// Dashboard API Service - Real backend integration
import { fetchApi } from './api-client';

export interface DashboardOverview {
  totalEmployees: number;
  activeEmployees: number;
  totalDepartments: number;
  pendingGatePasses: number;
  approvedGatePasses: number;
  rejectedGatePasses: number;
  pendingLeaves: number;
  approvedLeaves: number;
  pendingPurchaseRequests: number;
  pendingMRFs: number;
  visitorsToday: number;
  vehiclesInUse: number;
  assetsAssigned: number;
  unreadNotifications: number;
  pendingApprovals: number;
}

export interface DashboardMetrics {
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

export interface DashboardCharts {
  monthlyRequests: Array<{
    month: string;
    requests: number;
    approved: number;
    output: number;
  }>;
  requestBreakdown: Array<{
    name: string;
    value: number;
    key: string;
  }>;
  departmentPerformance: Array<{
    dept: string;
    score: number;
  }>;
  leaveTrend: Array<{
    month: string;
    sick: number;
    vacation: number;
    total: number;
  }>;
  gatePassTrend: Array<{
    month: string;
    outgoing: number;
    incoming: number;
    total: number;
  }>;
  purchaseRequests: Array<{
    month: string;
    total: number;
    approved: number;
    amount: number;
  }>;
  workflowStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  employeeDistribution: Array<{
    department: string;
    count: number;
    percentage: number;
  }>;
}

export const dashboardApi = {
  async getOverview(): Promise<DashboardOverview> {
    return fetchApi<DashboardOverview>('/dashboard/overview');
  },

  async getMetrics(): Promise<DashboardMetrics> {
    return fetchApi<DashboardMetrics>('/dashboard/metrics');
  },

  async getCharts(): Promise<DashboardCharts> {
    return fetchApi<DashboardCharts>('/dashboard/charts');
  },

  async getKPIs(): Promise<DashboardOverview> {
    return fetchApi<DashboardOverview>('/dashboard/kpis');
  },
};