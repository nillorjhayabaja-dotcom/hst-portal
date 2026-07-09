import type { Request, Response, NextFunction } from 'express';
import { workflowRepository } from '../../../infrastructure/database/repositories/workflow.repository';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../../../infrastructure/auth/rbac.middleware';
import { auditService } from '../../../infrastructure/audit/audit.service';
import { NotFoundError } from '../../../shared/errors';

export const workflowController = {
  list: [
    authenticate,
    requirePermission('workflow', 'view'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { moduleId } = req.query as any;
        const items = moduleId
          ? await workflowRepository.listByModule(moduleId)
          : await workflowRepository.listByModule('');
        res.json({ success: true, data: items });
      } catch (err) {
        next(err);
      }
    },
  ],

  get: [
    authenticate,
    requirePermission('workflow', 'view'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const wf = await workflowRepository.findById(req.params.id);
        if (!wf) throw new NotFoundError('Workflow not found');
        res.json({ success: true, data: wf });
      } catch (err) {
        next(err);
      }
    },
  ],

  create: [
    authenticate,
    requirePermission('workflow', 'create'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as any;
        const wf = await workflowRepository.create({
          moduleId: req.body.moduleId,
          name: req.body.name,
          description: req.body.description,
          createdBy: user?.id,
          steps: req.body.steps,
        });
        await auditService.fromRequest(req, 'create', 'workflow', { entityId: wf.id });
        res.status(201).json({ success: true, data: wf });
      } catch (err) {
        next(err);
      }
    },
  ],
};