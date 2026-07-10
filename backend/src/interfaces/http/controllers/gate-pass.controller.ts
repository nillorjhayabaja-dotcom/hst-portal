import type { Request, Response, NextFunction } from 'express';
import { gatePassService } from '../../../application/services/gate-pass.service';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../../../infrastructure/auth/rbac.middleware';
import type { AuthUser } from '../../../shared/types';

export const gatePassController = {
  list: [
    authenticate,
    requirePermission('gate-pass', 'view'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as AuthUser;
        const { status, departmentId, vehicleId, search, page, pageSize } = req.query as any;
        const result = await gatePassService.getAll(
          { status, departmentId, vehicleId, search, requesterId: user.id },
          parseInt(page) || 1,
          parseInt(pageSize) || 20,
        );
        res.json({
          success: true,
          data: result.items,
          meta: { total: result.total, page: result.page, pageSize: result.pageSize },
        });
      } catch (err) {
        next(err);
      }
    },
  ],

  get: [
    authenticate,
    requirePermission('gate-pass', 'view'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const gatePass = await gatePassService.getById(req.params.id);
        res.json({ success: true, data: gatePass });
      } catch (err) {
        next(err);
      }
    },
  ],

  create: [
    authenticate,
    requirePermission('gate-pass', 'create'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as AuthUser;
        const result = await gatePassService.create({
          ...req.body,
          requesterId: user.id,
        });
        res.status(201).json({ success: true, data: result });
      } catch (err) {
        next(err);
      }
    },
  ],

  submit: [
    authenticate,
    requirePermission('gate-pass', 'edit'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as AuthUser;
        const result = await gatePassService.submit(req.params.id, user.id);
        res.json({ success: true, data: result });
      } catch (err) {
        next(err);
      }
    },
  ],

  approve: [
    authenticate,
    requirePermission('gate-pass', 'approve'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as AuthUser;
        const { note } = req.body;
        const result = await gatePassService.approve(req.params.id, user.id, note);
        res.json({ success: true, data: result });
      } catch (err) {
        next(err);
      }
    },
  ],

  reject: [
    authenticate,
    requirePermission('gate-pass', 'approve'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as AuthUser;
        const { note } = req.body;
        const result = await gatePassService.reject(req.params.id, user.id, note);
        res.json({ success: true, data: result });
      } catch (err) {
        next(err);
      }
    },
  ],

  returnForRevision: [
    authenticate,
    requirePermission('gate-pass', 'approve'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as AuthUser;
        const { note } = req.body;
        const result = await gatePassService.returnForRevision(req.params.id, user.id, note);
        res.json({ success: true, data: result });
      } catch (err) {
        next(err);
      }
    },
  ],

  cancel: [
    authenticate,
    requirePermission('gate-pass', 'edit'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as AuthUser;
        const result = await gatePassService.cancel(req.params.id, user.id);
        res.json({ success: true, data: result });
      } catch (err) {
        next(err);
      }
    },
  ],

  securityRelease: [
    authenticate,
    requirePermission('gate-pass', 'approve'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as AuthUser;
        const result = await gatePassService.securityRelease(req.params.id, user.id);
        res.json({ success: true, data: result });
      } catch (err) {
        next(err);
      }
    },
  ],

  assignVehicle: [
    authenticate,
    requirePermission('gate-pass', 'edit'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as AuthUser;
        const { vehicleId } = req.body;
        const result = await gatePassService.assignVehicle(req.params.id, vehicleId, user.id);
        res.json({ success: true, data: result });
      } catch (err) {
        next(err);
      }
    },
  ],

  dashboard: [
    authenticate,
    requirePermission('gate-pass', 'view'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as AuthUser;
        const stats = await gatePassService.getDashboardStats(user.id);
        res.json({ success: true, data: stats });
      } catch (err) {
        next(err);
      }
    },
  ],

  print: [
    authenticate,
    requirePermission('gate-pass', 'view'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const gatePass = await gatePassService.incrementPrintCount(req.params.id);
        res.json({ success: true, data: { printCount: gatePass.printCount } });
      } catch (err) {
        next(err);
      }
    },
  ],
};
