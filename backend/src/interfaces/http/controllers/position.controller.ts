import type { Request, Response, NextFunction } from 'express';
import { positionService } from '../../../application/services/position.service';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../../../infrastructure/auth/rbac.middleware';
import { auditService } from '../../../infrastructure/audit/audit.service';
import { NotFoundError } from '../../../shared/errors';

export const positionController = {
  list: [
    authenticate,
    requirePermission('positions', 'view'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await positionService.getAll();
        res.json({ success: true, data: result.items, meta: { total: result.total } });
      } catch (err) {
        next(err);
      }
    },
  ],

  get: [
    authenticate,
    requirePermission('positions', 'view'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const position = await positionService.getById(req.params.id);
        res.json({ success: true, data: position });
      } catch (err) {
        next(err);
      }
    },
  ],

  getByDepartment: [
    authenticate,
    requirePermission('positions', 'view'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const positions = await positionService.getByDepartment(req.params.departmentId);
        res.json({ success: true, data: positions });
      } catch (err) {
        next(err);
      }
    },
  ],

  create: [
    authenticate,
    requirePermission('positions', 'create'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const position = await positionService.create(req.body);
        await auditService.fromRequest(req, 'create', 'position', { entityId: position.id });
        res.status(201).json({ success: true, data: position });
      } catch (err) {
        next(err);
      }
    },
  ],

  update: [
    authenticate,
    requirePermission('positions', 'edit'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const position = await positionService.update(req.params.id, req.body);
        await auditService.fromRequest(req, 'update', 'position', { entityId: position.id });
        res.json({ success: true, data: position });
      } catch (err) {
        next(err);
      }
    },
  ],

  delete: [
    authenticate,
    requirePermission('positions', 'delete'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await positionService.delete(req.params.id);
        res.json({ success: true, data: result });
      } catch (err) {
        next(err);
      }
    },
  ],
};
