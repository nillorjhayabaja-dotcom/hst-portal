import type { Request, Response, NextFunction } from 'express';
import { departmentService } from '../../../application/services/department.service';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../../../infrastructure/auth/rbac.middleware';
import { auditService } from '../../../infrastructure/audit/audit.service';
import { NotFoundError } from '../../../shared/errors';

export const departmentController = {
  list: [
    authenticate,
    requirePermission('departments', 'view'),
    async (_req: Request, res: Response, next: NextFunction) => {
      try {
        const items = await departmentService.getAll();
        res.json({ success: true, data: items.items });
      } catch (err) {
        next(err);
      }
    },
  ],

  get: [
    authenticate,
    requirePermission('departments', 'view'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const dept = await departmentService.getById(req.params.id);
        res.json({ success: true, data: dept });
      } catch (err) {
        next(err);
      }
    },
  ],

  create: [
    authenticate,
    requirePermission('departments', 'create'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const dept = await departmentService.create(req.body);
        await auditService.fromRequest(req, 'create', 'department', { entityId: dept.id });
        res.status(201).json({ success: true, data: dept });
      } catch (err) {
        next(err);
      }
    },
  ],

  update: [
    authenticate,
    requirePermission('departments', 'edit'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const dept = await departmentService.update(req.params.id, req.body);
        await auditService.fromRequest(req, 'update', 'department', { entityId: dept.id });
        res.json({ success: true, data: dept });
      } catch (err) {
        next(err);
      }
    },
  ],
};
