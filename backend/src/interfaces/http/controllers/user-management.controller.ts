import type { Request, Response, NextFunction } from 'express';
import { userManagementService } from '../../../application/services/user-management.service';
import { authenticate } from '../middleware/auth';
import { ForbiddenError } from '../../../shared/errors';
import type { AuthUser } from '../../../shared/types';

export const userManagementController = {
  getDashboardSummary: [
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as AuthUser;
        if (!user.roles.includes('super_admin')) {
          throw new ForbiddenError('Only Super Admin can access user management');
        }
        const summary = await userManagementService.getDashboardSummary();
        res.json({ success: true, data: summary });
      } catch (err) {
        next(err);
      }
    },
  ],

  getUsers: [
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as AuthUser;
        if (!user.roles.includes('super_admin')) {
          throw new ForbiddenError('Only Super Admin can access user management');
        }
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 10;
        const result = await userManagementService.getUsers({ ...req.query, page, pageSize } as any);
        res.json({ success: true, data: result.data, pagination: result.pagination });
      } catch (err) {
        next(err);
      }
    },
  ],

  getUserById: [
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as AuthUser;
        if (!user.roles.includes('super_admin')) {
          throw new ForbiddenError('Only Super Admin can access user management');
        }
        const result = await userManagementService.getUserById(req.params.id);
        res.json({ success: true, data: result });
      } catch (err) {
        next(err);
      }
    },
  ],

  createUser: [
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const actor = req.user as AuthUser;
        if (!actor.roles.includes('super_admin')) {
          throw new ForbiddenError('Only Super Admin can create accounts');
        }
        const result = await userManagementService.createUser(req.body, actor);
        res.status(201).json({ success: true, data: result });
      } catch (err) {
        next(err);
      }
    },
  ],

  updateUser: [
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const actor = req.user as AuthUser;
        if (!actor.roles.includes('super_admin')) {
          throw new ForbiddenError('Only Super Admin can update accounts');
        }
        const result = await userManagementService.updateUser(req.params.id, req.body, actor);
        res.json({ success: true, data: result });
      } catch (err) {
        next(err);
      }
    },
  ],

  resetPassword: [
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const actor = req.user as AuthUser;
        if (!actor.roles.includes('super_admin')) {
          throw new ForbiddenError('Only Super Admin can reset passwords');
        }
        await userManagementService.resetPassword(req.params.id, actor, {
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
        res.json({ success: true, data: { message: 'Password reset successful' } });
      } catch (err) {
        next(err);
      }
    },
  ],

  toggleActive: [
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const actor = req.user as AuthUser;
        if (!actor.roles.includes('super_admin')) {
          throw new ForbiddenError('Only Super Admin can change account status');
        }
        await userManagementService.toggleActive(req.params.id, actor, {
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
        res.json({ success: true, data: { message: 'Account status updated' } });
      } catch (err) {
        next(err);
      }
    },
  ],

  toggleLock: [
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const actor = req.user as AuthUser;
        if (!actor.roles.includes('super_admin')) {
          throw new ForbiddenError('Only Super Admin can lock/unlock accounts');
        }
        await userManagementService.toggleLock(req.params.id, actor, {
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
        res.json({ success: true, data: { message: 'Account lock status updated' } });
      } catch (err) {
        next(err);
      }
    },
  ],

  suspendUser: [
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const actor = req.user as AuthUser;
        if (!actor.roles.includes('super_admin')) {
          throw new ForbiddenError('Only Super Admin can suspend accounts');
        }
        await userManagementService.suspendUser(req.params.id, req.body.reason, actor, {
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
        res.json({ success: true, data: { message: 'Account suspended' } });
      } catch (err) {
        next(err);
      }
    },
  ],

  unsuspendUser: [
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const actor = req.user as AuthUser;
        if (!actor.roles.includes('super_admin')) {
          throw new ForbiddenError('Only Super Admin can unsuspend accounts');
        }
        await userManagementService.unsuspendUser(req.params.id, actor, {
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
        res.json({ success: true, data: { message: 'Account unsuspended' } });
      } catch (err) {
        next(err);
      }
    },
  ],

  forceLogout: [
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const actor = req.user as AuthUser;
        if (!actor.roles.includes('super_admin')) {
          throw new ForbiddenError('Only Super Admin can force logout');
        }
        await userManagementService.forceLogout(req.params.id, actor, {
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
        res.json({ success: true, data: { message: 'Force logout successful' } });
      } catch (err) {
        next(err);
      }
    },
  ],

  changeUserRole: [
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const actor = req.user as AuthUser;
        if (!actor.roles.includes('super_admin')) {
          throw new ForbiddenError('Only Super Admin can change roles');
        }
        await userManagementService.changeUserRole(req.params.id, req.body.roleIds, actor, {
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
        res.json({ success: true, data: { message: 'Role updated' } });
      } catch (err) {
        next(err);
      }
    },
  ],

  getUserSessions: [
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const actor = req.user as AuthUser;
        if (!actor.roles.includes('super_admin')) {
          throw new ForbiddenError('Only Super Admin can view sessions');
        }
        const sessions = await userManagementService.getUserSessions(req.params.id);
        res.json({ success: true, data: sessions });
      } catch (err) {
        next(err);
      }
    },
  ],

  getLoginHistory: [
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const actor = req.user as AuthUser;
        if (!actor.roles.includes('super_admin')) {
          throw new ForbiddenError('Only Super Admin can view login history');
        }
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 20;
        const result = await userManagementService.getUserLoginHistory(req.params.id, page, pageSize);
        res.json({ success: true, data: result.data, pagination: result.pagination });
      } catch (err) {
        next(err);
      }
    },
  ],

  getUserDevices: [
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const actor = req.user as AuthUser;
        if (!actor.roles.includes('super_admin')) {
          throw new ForbiddenError('Only Super Admin can view devices');
        }
        const devices = await userManagementService.getUserDevices(req.params.id);
        res.json({ success: true, data: devices });
      } catch (err) {
        next(err);
      }
    },
  ],

  getAuditLogs: [
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const actor = req.user as AuthUser;
        if (!actor.roles.includes('super_admin')) {
          throw new ForbiddenError('Only Super Admin can view audit logs');
        }
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 20;
        const result = await userManagementService.getUserAuditLogs(req.params.id, page, pageSize);
        res.json({ success: true, data: result.data, pagination: result.pagination });
      } catch (err) {
        next(err);
      }
    },
  ],

  deleteUser: [
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const actor = req.user as AuthUser;
        if (!actor.roles.includes('super_admin')) {
          throw new ForbiddenError('Only Super Admin can delete accounts');
        }
        await userManagementService.softDeleteUser(req.params.id, actor, {
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
        res.json({ success: true, data: { message: 'User deleted' } });
      } catch (err) {
        next(err);
      }
    },
  ],

  changePassword: [
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const actor = req.user as AuthUser;
        const { currentPassword, newPassword } = req.body;

        await userManagementService.changePassword(actor.id, currentPassword, newPassword, actor, {
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
        res.json({ success: true, data: { message: 'Password changed successfully' } });
      } catch (err) {
        next(err);
      }
    },
  ],

  getRoles: [
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const actor = req.user as AuthUser;
        if (!actor.roles.includes('super_admin')) {
          throw new ForbiddenError('Only Super Admin can view roles');
        }
        const { prisma } = require('../../../infrastructure/database/prisma.service');
        const roles = await prisma.role.findMany({
          where: { isActive: true },
          include: {
            permissions: true,
          },
          orderBy: { level: 'asc' },
        });
        res.json({ success: true, data: roles });
      } catch (err) {
        next(err);
      }
    },
  ],

  getDepartments: [
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const actor = req.user as AuthUser;
        if (!actor.roles.includes('super_admin')) {
          throw new ForbiddenError('Only Super Admin can view departments');
        }
        const { prisma } = require('../../../infrastructure/database/prisma.service');
        const departments = await prisma.department.findMany({
          where: { isActive: true },
          orderBy: { name: 'asc' },
          include: { _count: { select: { positions: true } } },
        });
        res.json({ success: true, data: departments });
      } catch (err) {
        next(err);
      }
    },
  ],

  getPositions: [
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const actor = req.user as AuthUser;
        if (!actor.roles.includes('super_admin')) {
          throw new ForbiddenError('Only Super Admin can view positions');
        }
        const { prisma } = require('../../../infrastructure/database/prisma.service');
        const where: any = { isActive: true };
        if (req.query.departmentId) {
          where.departmentId = req.query.departmentId as string;
        }
        const positions = await prisma.position.findMany({
          where,
          orderBy: { title: 'asc' },
        });
        res.json({ success: true, data: positions });
      } catch (err) {
        next(err);
      }
    },
  ],
};