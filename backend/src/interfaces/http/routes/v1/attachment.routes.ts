import { Router } from 'express';
import { attachmentController } from '../../controllers/attachment.controller';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../../../infrastructure/auth/rbac.middleware';
import { env } from '../../../../infrastructure/config/env';
import multer from 'multer';

const upload = multer({ dest: env.upload.path, limits: { fileSize: env.upload.maxFileSize } });

const router = Router();

router.get('/:entityType/:entityId', ...attachmentController.list);
router.post(
  '/:entityType/:entityId',
  authenticate,
  requirePermission('attachments', 'create'),
  upload.single('file'),
  ...attachmentController.upload,
);
router.get('/:entityType/:entityId/:id/download', ...attachmentController.download);
router.delete('/:entityType/:entityId/:id', ...attachmentController.remove);

export default router;