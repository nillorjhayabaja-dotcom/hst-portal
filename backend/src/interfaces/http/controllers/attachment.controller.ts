import type { Request, Response, NextFunction } from 'express';
import { fileStorageService } from '../../../infrastructure/storage/file-storage.service';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../../../infrastructure/auth/rbac.middleware';
import { localStorageAdapter } from '../../../infrastructure/storage/local-storage.adapter';
import { createReadStream } from 'node:fs';
import { NotFoundError } from '../../../shared/errors';
import type { AuthUser } from '../../../shared/types';

export const attachmentController = {
  list: [
    authenticate,
    requirePermission('attachments', 'view'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { entityType, entityId } = req.params;
        res.json({ success: true, data: await fileStorageService.list(entityType, entityId) });
      } catch (err) {
        next(err);
      }
    },
  ],

  upload: [
    authenticate,
    requirePermission('attachments', 'create'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as AuthUser;
        const { entityType, entityId } = req.params;
        const file = (req as any).file;
        if (!file) throw new NotFoundError('No file uploaded');
        const att = await fileStorageService.upload(
          {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            stream: file.stream,
          },
          entityType,
          entityId,
          user.id,
        );
        res.status(201).json({ success: true, data: att });
      } catch (err) {
        next(err);
      }
    },
  ],

  download: [
    authenticate,
    requirePermission('attachments', 'view'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const att = await fileStorageService.list(req.params.entityType, req.params.entityId);
        const found = att.find((a: { id: string }) => a.id === req.params.id);
        if (!found) throw new NotFoundError('Attachment not found');
        const path = localStorageAdapter.resolve(found.storagePath);
        res.setHeader('Content-Type', found.mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${found.fileName}"`);
        createReadStream(path).pipe(res);
      } catch (err) {
        next(err);
      }
    },
  ],

  remove: [
    authenticate,
    requirePermission('attachments', 'delete'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as AuthUser;
        await fileStorageService.remove(req.params.id, user.id);
        res.json({ success: true, data: { deleted: true } });
      } catch (err) {
        next(err);
      }
    },
  ],
};