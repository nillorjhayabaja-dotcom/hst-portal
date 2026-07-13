import { Request, Response } from 'express';
import { approvalService } from '../../../application/services/approval.service';
import { notificationService } from '../../../infrastructure/notifications/notification.service';
import { EmployeeService } from '../../../application/services/employee.service';
import { departmentService } from '../../../application/services/department.service';
import { GatePassService } from '../../../application/services/gate-pass.service';

const employeeService = new EmployeeService();
const gatePassService = new GatePassService();

export const dashboardController = {
  async getOverview(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || '';
      const [
        totalEmployeesResult,
        departmentsResult,
        gatePassStats,
        approvalStats,
        notifications,
      ] = await Promise.all([
        employeeService.getAll({}, 1, 1),
        departmentService.getAll({}, 1, 50),
        gatePassService.getStats(),
        approvalService.getDashboardStats(),
        Promise.resolve(notificationService.unreadCount(userId)),
      ]);

      res.json({
        success: true,
        data: {
          totalEmployees: totalEmployeesResult.total,
          activeEmployees: totalEmployeesResult.total, // Assuming all are active for now
          totalDepartments: departmentsResult.total,
          pendingGatePasses: gatePassStats.pending,
          approvedGatePasses: gatePassStats.approved,
          rejectedGatePasses: gatePassStats.rejected,
          pendingLeaves: 0, // TODO: Implement leave stats
          approvedLeaves: 0,
          pendingPurchaseRequests: 0, // TODO: Implement PR stats
          pendingMRFs: 0, // TODO: Implement MRF stats
          visitorsToday: 0, // TODO: Implement visitor stats
          vehiclesInUse: 0, // TODO: Implement vehicle stats
          assetsAssigned: 0, // TODO: Implement asset stats
          unreadNotifications: notifications,
          pendingApprovals: approvalStats.pending,
        },
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
      const approvalStats = await approvalService.getDashboardStats();
      
      // Calculate approval rate
      const approvalRate = approvalStats.total > 0 
        ? Math.round((approvalStats.approved / approvalStats.total) * 100) 
        : 0;

      res.json({
        success: true,
        data: {
          totalRequests: approvalStats.total,
          pendingApprovals: approvalStats.pending,
          approvedToday: approvalStats.todayCount,
          rejectedToday: approvalStats.rejected, // Note: This is total rejected, not today
          averageApprovalTime: 0, // TODO: Calculate average approval time
          approvalRate,
          byModule: {}, // TODO: Implement module breakdown
          byPriority: {}, // TODO: Implement priority breakdown
          byDepartment: {}, // TODO: Implement department breakdown
          monthlyTrend: [], // TODO: Implement monthly trend
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
      // TODO: Implement actual chart data from database
      // For now, return empty arrays that the frontend can handle
      res.json({
        success: true,
        data: {
          monthlyRequests: [],
          requestBreakdown: [],
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