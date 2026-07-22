import { Router } from 'express';
import { notificationController } from '../../controllers/notification.controller';

const router = Router();

router.get('/', ...notificationController.list);
router.get('/unread-count/:userId', ...notificationController.unreadCount);
router.post('/:id/read', ...notificationController.markRead);
router.post('/mark-all-read/:userId', ...notificationController.markAllRead);
router.delete('/:id', ...notificationController.delete);
router.delete('/delete-all/:userId', ...notificationController.deleteAll);

export default router;
