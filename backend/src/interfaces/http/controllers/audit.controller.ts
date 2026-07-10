import type { Request, Response, NextFunction } from 'express';
import { auditService } from '../../../infrastructure/audit/audit.service';
import { toPagination, buildMeta } from '../../../shared/types';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../../../infrastructure/auth/rbac.middleware';

export const auditController = {
  list: [
    authenticate,
    requirePermission('audit', 'view'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const p = toPagination(req.query as any);
        const { entityType, actorId } = req.query as any;
        const { items, total } = await auditService.list({
          skip: p.skip,
          take: p.take,
          entityType: entityType as string | undefined,
          actorId: actorId as string | undefined,
        });
        res.json({ success: true, data: items, meta: buildMeta(total, p) });
      } catch (err) {
        next(err);
      }
    },
  ],
};
