import type { Request, Response, NextFunction } from 'express';
import { roleRepository, permissionRepository } from '../../../infrastructure/database/repositories/role.repository';
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
        res.json({ success: true, data: await roleRepository.list() });
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
        const role = await roleRepository.findById(req.params.id);
        if (!role) throw new NotFoundError('Role not found');
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
        const role = await roleRepository.create(req.body);
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
        await roleRepository.setPermissions(req.params.id, req.body.permissions);
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
        res.json({ success: true, data: await permissionRepository.listByRole(req.params.id) });
      } catch (err) {
        next(err);
      }
    },
  ],
};