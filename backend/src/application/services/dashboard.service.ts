import { prisma } from '../../infrastructure/database/prisma.service';
import { authorizationService } from './authorization.service';
import type { AuthUser } from '../../shared/types';

export interface DashboardStats {
  myRequests: number;
  pending: number;
  approved: number;
  rejected: number;
  unreadNotifications: number;
  byModule: Record<string, number>;
}

export interface AdminDashboardStats extends DashboardStats {
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
  pendingApprovals: number;
}

export interface SecurityDashboardStats {
  releasedToday: number;
  returnedToday: number;
  employeesOutside: number;
  obMealEligible: number;
  pendingVerifications: number;
  totalScansToday: number;
}

export interface SuperAdminDashboardStats extends AdminDashboardStats {
  onlineUsers: number;
  lockedAccounts: number;
  activeSessions: number;
  failedLoginsToday: number;
  auditEventsToday: number;
  passwordResetsToday: number;
}

/**
 * Enterprise Dashboard Service
 * 
 * Provides role-specific dashboard statistics with server-side filtering.
 * Every query is filtered by the authenticated user's role and permissions.
 * Never relies on frontend filtering.
 */
export class DashboardService {
  /**
   * Get dashboard overview based on user role
   */
  async getOverview(user: AuthUser): Promise<any> {
    const scope = authorizationService.getDataScope(user);
    
    switch (scope.type) {
      case 'all':
        return this.getAdminDashboard(user);
      case 'security':
        return this.getSecurityDashboard(user);
      case 'department':
        return this.getManagerDashboard(user);
      case 'own':
      default:
        return this.getEmployeeDashboard(user);
    }
  }

  /**
   * Employee Dashboard - Only their own data
   */
  private async getEmployeeDashboard(user: AuthUser): Promise<DashboardStats> {
    const userId = user.id;

    // Single aggregated query for approval stats
    const approvalStats = await prisma.approvalRequest.groupBy({
      by: ['status'],
      where: { requesterId: userId },
      _count: { id: true },
    });

    const total = approvalStats.reduce((sum, s) => sum + s._count.id, 0);
    const pending = approvalStats
      .filter(s => ['pending', 'in_review'].includes(s.status))
      .reduce((sum, s) => sum + s._count.id, 0);
    const approved = approvalStats
      .filter(s => s.status === 'approved')
      .reduce((sum, s) => sum + s._count.id, 0);
    const rejected = approvalStats
      .filter(s => ['rejected', 'returned', 'cancelled'].includes(s.status))
      .reduce((sum, s) => sum + s._count.id, 0);

    // Module breakdown
    const byModuleData = await prisma.approvalRequest.groupBy({
      by: ['moduleId'],
      where: { requesterId: userId },
      _count: { id: true },
    });
    const byModule: Record<string, number> = {};
    byModuleData.forEach(m => { byModule[m.moduleId] = m._count.id; });

    // Notification count
    const unreadNotifications = await prisma.notification.count({
      where: { recipientId: userId, isRead: false },
    });

    return {
      myRequests: total,
      pending,
      approved,
      rejected,
      unreadNotifications,
      byModule,
    };
  }

  /**
   * Admin Dashboard - Organization-wide data
   */
  private async getAdminDashboard(user: AuthUser): Promise<AdminDashboardStats> {
    const employeeStats = await this.getEmployeeDashboard(user);

    const [
      totalEmployees,
      activeEmployees,
      totalDepartments,
      gatePassStats,
      leaveStats,
      purchaseStats,
      mrfStats,
      visitorsToday,
      vehiclesInUse,
      assetsAssigned,
    ] = await Promise.all([
      prisma.employee.count(),
      prisma.employee.count({ where: { status: 'active' } }),
      prisma.department.count({ where: { isActive: true } }),
      this.getGatePassStats(),
      this.getLeaveStats(),
      this.getPurchaseStats(),
      this.getMRFStats(),
      this.getVisitorsToday(),
      this.getVehiclesInUse(),
      this.getAssetsAssigned(),
    ]);

    return {
      ...employeeStats,
      totalEmployees,
      activeEmployees,
      totalDepartments,
      pendingGatePasses: gatePassStats.pending,
      approvedGatePasses: gatePassStats.approved,
      rejectedGatePasses: gatePassStats.rejected,
      pendingLeaves: leaveStats.pending,
      approvedLeaves: leaveStats.approved,
      pendingPurchaseRequests: purchaseStats.pending,
      pendingMRFs: mrfStats.pending,
      visitorsToday,
      vehiclesInUse,
      assetsAssigned,
      pendingApprovals: employeeStats.pending,
    };
  }

  /**
   * Manager Dashboard - Department + approval queue
   */
  private async getManagerDashboard(user: AuthUser): Promise<any> {
    const employeeStats = await this.getEmployeeDashboard(user);
    
    // Get department ID from user's employee record
    const employee = await prisma.employee.findUnique({
      where: { userId: user.id },
      select: { departmentId: true },
    });

    const departmentId = employee?.departmentId;

    // Department-level stats
    const departmentStats = departmentId ? await prisma.approvalRequest.groupBy({
      by: ['status'],
      where: { departmentId },
      _count: { id: true },
    }) : [];

    const deptTotal = departmentStats.reduce((sum, s) => sum + s._count.id, 0);
    const deptPending = departmentStats
      .filter(s => ['pending', 'in_review'].includes(s.status))
      .reduce((sum, s) => sum + s._count.id, 0);

    return {
      ...employeeStats,
      departmentRequests: deptTotal,
      departmentPending: deptPending,
      departmentId,
    };
  }

  /**
   * Security Dashboard - Gate pass operations
   */
  private async getSecurityDashboard(user: AuthUser): Promise<SecurityDashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      releasedToday,
      returnedToday,
      employeesOutside,
      obMealEligible,
      pendingVerifications,
      totalScansToday,
    ] = await Promise.all([
      prisma.gatePass.count({
        where: { securityReleasedAt: { gte: today }, releaseStatus: 'released' },
      }),
      prisma.gatePass.count({
        where: { returnedAt: { gte: today }, releaseStatus: 'returned' },
      }),
      prisma.gatePass.count({
        where: { gateStatus: 'outside' },
      }),
      prisma.gatePass.count({
        where: { obMealEligible: true, obMealEnabled: false },
      }),
      prisma.gatePassVerification.count({
        where: { status: 'generated' },
      }),
      prisma.qRScanLog.count({
        where: { scannedAt: { gte: today } },
      }),
    ]);

    return {
      releasedToday,
      returnedToday,
      employeesOutside,
      obMealEligible,
      pendingVerifications,
      totalScansToday,
    };
  }

  // Helper methods for aggregated stats
  private async getGatePassStats() {
    const stats = await prisma.gatePass.groupBy({
      by: ['releaseStatus'],
      _count: { id: true },
    });
    return {
      pending: stats.find(s => s.releaseStatus === 'pending')?._count.id || 0,
      approved: stats.find(s => s.releaseStatus === 'completed')?._count.id || 0,
      rejected: 0,
    };
  }

  private async getLeaveStats() {
    const stats = await prisma.leaveRequest.groupBy({
      by: ['requestId'],
      _count: { id: true },
    });
    return { pending: 0, approved: 0 };
  }

  private async getPurchaseStats() {
    return { pending: 0 };
  }

  private async getMRFStats() {
    return { pending: 0 };
  }

  private async getVisitorsToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return prisma.visitor.count({
      where: { createdAt: { gte: today } },
    });
  }

  private async getVehiclesInUse(): Promise<number> {
    return prisma.vehicle.count({
      where: { status: 'in_use' },
    });
  }

  private async getAssetsAssigned(): Promise<number> {
    return prisma.asset.count({
      where: { status: 'assigned' },
    });
  }
}

export const dashboardService = new DashboardService();