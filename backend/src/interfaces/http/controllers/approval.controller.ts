import type { Request, Response, NextFunction } from 'express';
import { approvalService } from '../../../application/services/approval.service';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../../../infrastructure/auth/rbac.middleware';
import { auditService } from '../../../infrastructure/audit/audit.service';

export const approvalController = {
  // GET /api/v1/approval-requests
  getAll: [
    authenticate,
    requirePermission('approval', 'view'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { status, moduleId, requesterId, page, pageSize } = req.query as any;
        
        const result = await approvalService.getAll(
          {
            status,
            moduleId,
            requesterId,
          },
          page ? parseInt(page) : 1,
          pageSize ? parseInt(pageSize) : 20
        );

        res.json({
          success: true,
          data: result.items,
          meta: {
            total: result.total,
            page: result.page,
            pageSize: result.pageSize,
            totalPages: Math.ceil(result.total / result.pageSize),
          },
          errors: null,
        });
      } catch (err) {
        next(err);
      }
    },
  ],

  // GET /api/v1/approval-requests/:id
  getById: [
    authenticate,
    requirePermission('approval', 'view'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const request = await approvalService.getById(req.params.id);
        res.json({ success: true, data: request, errors: null });
      } catch (err) {
        next(err);
      }
    },
  ],

  // GET /api/v1/approval-requests/pending/:userId
  getPending: [
    authenticate,
    requirePermission('approval', 'view'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { userId } = req.params;
        const { page, pageSize } = req.query as any;
        
        const result = await approvalService.getPending(
          userId,
          page ? parseInt(page) : 1,
          pageSize ? parseInt(pageSize) : 20
        );

        res.json({
          success: true,
          data: result.items,
          meta: {
            total: result.total,
            page: result.page,
            pageSize: result.pageSize,
            totalPages: Math.ceil(result.total / result.pageSize),
          },
          errors: null,
        });
      } catch (err) {
        next(err);
      }
    },
  ],

  // GET /api/v1/approval-requests/mine/:userId
  getMine: [
    authenticate,
    requirePermission('approval', 'view'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { userId } = req.params;
        const { page, pageSize } = req.query as any;
        
        const result = await approvalService.getMine(
          userId,
          page ? parseInt(page) : 1,
          pageSize ? parseInt(pageSize) : 20
        );

        res.json({
          success: true,
          data: result.items,
          meta: {
            total: result.total,
            page: result.page,
            pageSize: result.pageSize,
            totalPages: Math.ceil(result.total / result.pageSize),
          },
          errors: null,
        });
      } catch (err) {
        next(err);
      }
    },
  ],

  // POST /api/v1/approval-requests/:id/approve
  approve: [
    authenticate,
    requirePermission('approval', 'approve'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as any;
        const { id } = req.params;
        const { note } = req.body;

        const result = await approvalService.approve(id, user?.id, note);
        
        await auditService.fromRequest(req, 'approve', 'approval-request', { 
          entityId: id,
          metadata: result,
        });

        res.json({ success: true, data: result, errors: null });
      } catch (err) {
        next(err);
      }
    },
  ],

  // POST /api/v1/approval-requests/:id/reject
  reject: [
    authenticate,
    requirePermission('approval', 'reject'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as any;
        const { id } = req.params;
        const { reason } = req.body;

        const result = await approvalService.reject(id, user?.id, reason);
        
        await auditService.fromRequest(req, 'reject', 'approval-request', { 
          entityId: id,
          metadata: result,
        });

        res.json({ success: true, data: result, errors: null });
      } catch (err) {
        next(err);
      }
    },
  ],

  // POST /api/v1/approval-requests/:id/return
  returnRequest: [
    authenticate,
    requirePermission('approval', 'approve'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as any;
        const { id } = req.params;
        const { note } = req.body;

        const result = await approvalService.returnToRequester(id, user?.id, note);
        
        await auditService.fromRequest(req, 'return', 'approval-request', { 
          entityId: id,
          metadata: result,
        });

        res.json({ success: true, data: result, errors: null });
      } catch (err) {
        next(err);
      }
    },
  ],

  // POST /api/v1/approval-requests/:id/delegate
  delegate: [
    authenticate,
    requirePermission('approval', 'approve'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as any;
        const { id } = req.params;
        const { delegateId, note } = req.body;

        const result = await approvalService.delegate(id, delegateId, user?.id);
        
        await auditService.fromRequest(req, 'delegate', 'approval-request', { 
          entityId: id,
          metadata: result,
        });

        res.json({ success: true, data: result, errors: null });
      } catch (err) {
        next(err);
      }
    },
  ],

  // POST /api/v1/approval-requests/:id/recall
  recall: [
    authenticate,
    requirePermission('approval', 'approve'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as any;
        const { id } = req.params;

        const result = await approvalService.recall(id, user?.id);
        
        await auditService.fromRequest(req, 'recall', 'approval-request', { 
          entityId: id,
          metadata: result,
        });

        res.json({ success: true, data: result, errors: null });
      } catch (err) {
        next(err);
      }
    },
  ],
};