import type { Request, Response, NextFunction } from 'express';
import { roleService } from '../../../application/services/role.service';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../../../infrastructure/auth/rbac.middleware';
import { auditService } from '../../../infrastructure/audit/audit.service';
import { NotFoundError } from '../../../shared/errors';

export const roleController = {
  list: [
    authenticate,
    requirePermission('roles', 'view'),
    async (_req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await roleService.getAll();
        res.json({ success: true, data: result.items });
      } catch (err) {
        next(err);
      }
    },
  ],

  get: [
    authenticate,
    requirePermission('roles', 'view'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const role = await roleService.getById(req.params.id);
        res.json({ success: true, data: role });
      } catch (err) {
        next(err);
      }
    },
  ],

  create: [
    authenticate,
    requirePermission('roles', 'create'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const role = await roleService.create(req.body);
        await auditService.fromRequest(req, 'create', 'role', { entityId: role.id });
        res.status(201).json({ success: true, data: role });
      } catch (err) {
        next(err);
      }
    },
  ],

  setPermissions: [
    authenticate,
    requirePermission('roles', 'edit'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await roleService.setPermissions(req.params.id, req.body.permissions);
        await auditService.fromRequest(req, 'update', 'role', { entityId: req.params.id });
        res.json({ success: true, data: { updated: true } });
      } catch (err) {
        next(err);
      }
    },
  ],

  listPermissions: [
    authenticate,
    requirePermission('roles', 'view'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const permissions = await roleService.getPermissions(req.params.id);
        res.json({ success: true, data: permissions });
      } catch (err) {
        next(err);
      }
    },
  ],
};
