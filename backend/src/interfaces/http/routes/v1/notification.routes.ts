import { Router } from 'express';
import { notificationController } from '../../controllers/notification.controller';

const router = Router();

router.get('/', ...notificationController.list);
router.post('/:id/read', ...notificationController.markRead);

export default router;