import { Request, Response } from 'express';
import { dashboardService } from '../../../application/services/dashboard.service';
import { auditService } from '../../../infrastructure/audit/audit.service';
import type { AuthUser } from '../../../shared/types';

export const dashboardController = {
  async getOverview(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      
      // SECURITY: Dashboard data is filtered server-side by the DashboardService
      // based on the authenticated user's role. No frontend filtering is trusted.
      const data = await dashboardService.getOverview(user);

      // Disable caching - always return fresh data
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');

      res.json({
        success: true,
        data,
        meta: null,
        errors: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching dashboard overview:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard overview',
        data: null,
        meta: null,
        errors: [errorMessage],
      });
    }
  },

  async getMetrics(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const data = await dashboardService.getOverview(user);

      // Calculate approval rate
      const approvalRate = data.myRequests > 0 
        ? Math.round((data.approved / data.myRequests) * 100) 
        : 0;

      res.json({
        success: true,
        data: {
          totalRequests: data.myRequests,
          pendingApprovals: data.pending,
          approvedToday: 0,
          rejectedToday: data.rejected,
          averageApprovalTime: 0,
          approvalRate,
          byModule: data.byModule || {},
          byPriority: {},
          byDepartment: {},
          monthlyTrend: [],
        },
        meta: null,
        errors: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching dashboard metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard metrics',
        data: null,
        meta: null,
        errors: [errorMessage],
      });
    }
  },

  async getCharts(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const data = await dashboardService.getOverview(user);

      res.json({
        success: true,
        data: {
          monthlyRequests: [],
          requestBreakdown: Object.entries(data.byModule || {}).map(([module, count]) => ({
            module,
            count,
          })),
          departmentPerformance: [],
          leaveTrend: [],
          gatePassTrend: [],
          purchaseRequests: [],
          workflowStatus: [],
          employeeDistribution: [],
        },
        meta: null,
        errors: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching dashboard charts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard charts',
        data: null,
        meta: null,
        errors: [errorMessage],
      });
    }
  },
};