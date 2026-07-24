import type { Request, Response, NextFunction } from 'express';
import { gatePassCompanionService } from '../../../application/services/gate-pass-companion.service';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../../../infrastructure/auth/rbac.middleware';
import type { AuthUser } from '../../../shared/types';

export const gatePassCompanionController = {
  /**
   * GET /gate-pass/:gatePassId/companions
   */
  getByGatePassId: [
    authenticate,
    requirePermission('gate-pass', 'view'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { gatePassId } = req.params;
        const companions = await gatePassCompanionService.getCompanions(gatePassId);
        res.json({ success: true, data: companions });
      } catch (err) {
        next(err);
      }
    },
  ],

  /**
   * GET /gate-pass/request/:requestId/companions
   */
  getByRequestId: [
    authenticate,
    requirePermission('gate-pass', 'view'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { requestId } = req.params;
        const companions = await gatePassCompanionService.getCompanionsByRequestId(requestId);
        res.json({ success: true, data: companions });
      } catch (err) {
        next(err);
      }
    },
  ],

  /**
   * POST /gate-pass/:gatePassId/companions
   */
  add: [
    authenticate,
    requirePermission('gate-pass', 'edit'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as AuthUser;
        const { gatePassId } = req.params;
        const { fullName, employeeId } = req.body;

        const companion = await gatePassCompanionService.addCompanion(
          gatePassId,
          { fullName, employeeId },
          user.id
        );

        res.status(201).json({ success: true, data: companion, message: 'Companion added' });
      } catch (err) {
        next(err);
      }
    },
  ],

  /**
   * POST /gate-pass/:gatePassId/companions/bulk
   */
  addBulk: [
    authenticate,
    requirePermission('gate-pass', 'edit'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as AuthUser;
        const { gatePassId } = req.params;
        const { companions } = req.body;

        if (!Array.isArray(companions)) {
          return res.status(400).json({ success: false, message: 'companions must be an array' });
        }

        const results = await gatePassCompanionService.addCompanionsBulk(
          gatePassId,
          companions,
          user.id
        );

        res.status(201).json({ success: true, data: results, message: `${results.length} companions added` });
      } catch (err) {
        next(err);
      }
    },
  ],

  /**
   * DELETE /gate-pass/companions/:companionId
   */
  remove: [
    authenticate,
    requirePermission('gate-pass', 'edit'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as AuthUser;
        const { companionId } = req.params;

        const result = await gatePassCompanionService.removeCompanion(companionId, user.id);

        res.json({ success: true, data: result, message: 'Companion removed' });
      } catch (err) {
        next(err);
      }
    },
  ],

  /**
   * PATCH /gate-pass/companions/:companionId
   */
  update: [
    authenticate,
    requirePermission('gate-pass', 'edit'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as AuthUser;
        const { companionId } = req.params;
        const { fullName, employeeId } = req.body;

        const updated = await gatePassCompanionService.updateCompanion(
          companionId,
          { fullName, employeeId },
          user.id
        );

        res.json({ success: true, data: updated, message: 'Companion updated' });
      } catch (err) {
        next(err);
      }
    },
  ],

  /**
   * DELETE /gate-pass/:gatePassId/companions
   */
  clear: [
    authenticate,
    requirePermission('gate-pass', 'edit'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as AuthUser;
        const { gatePassId } = req.params;

        const result = await gatePassCompanionService.clearCompanions(gatePassId, user.id);

        res.json({ success: true, data: result, message: `${result.removedCount} companions cleared` });
      } catch (err) {
        next(err);
      }
    },
  ],
};