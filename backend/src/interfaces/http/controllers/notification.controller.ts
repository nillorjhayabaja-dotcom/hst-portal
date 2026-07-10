import type { Request, Response, NextFunction } from 'express';
import { notificationService } from '../../../infrastructure/notifications/notification.service';
import { authenticate } from '../middleware/auth';
import type { AuthUser } from '../../../shared/types';

export const notificationController = {
  list: [
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as AuthUser;
        const unreadOnly = req.query.unread === 'true';
        const items = await notificationService.listForUser(user.id, unreadOnly);
        const unread = await notificationService.unreadCount(user.id);
        res.json({ success: true, data: { items, unreadCount: unread } });
      } catch (err) {
        next(err);
      }
    },
  ],

  markRead: [
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as AuthUser;
        await notificationService.markRead(req.params.id, user.id);
        res.json({ success: true, data: { marked: true } });
      } catch (err) {
        next(err);
      }
    },
  ],
};
