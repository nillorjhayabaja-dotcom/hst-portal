import type { Request, Response, NextFunction } from 'express';
import { departmentRepository } from '../../../infrastructure/database/repositories/department.repository';
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
        const items = await departmentRepository.list();
        res.json({ success: true, data: items });
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
        const dept = await departmentRepository.findById(req.params.id);
        if (!dept) throw new NotFoundError('Department not found');
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
        const dept = await departmentRepository.create(req.body);
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
        const dept = await departmentRepository.update(req.params.id, req.body);
        await auditService.fromRequest(req, 'update', 'department', { entityId: dept.id });
        res.json({ success: true, data: dept });
      } catch (err) {
        next(err);
      }
    },
  ],
};