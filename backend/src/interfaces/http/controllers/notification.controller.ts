import type { Request, Response, NextFunction } from 'express';
import { notificationService } from '../../../infrastructure/notifications/notification.service';
import { authenticate } from '../middleware/auth';
import type { AuthUser } from '../../../shared/types';
import { prisma } from '../../../infrastructure/database/prisma.service';

export const notificationController = {
  list: [
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as AuthUser;
        const unreadOnly = req.query.isRead === 'false';
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 50;
        const skip = (page - 1) * pageSize;

        const where: any = { recipientId: user.id };
        if (unreadOnly) where.isRead = false;

        const [items, total] = await Promise.all([
          prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: pageSize,
          }),
          prisma.notification.count({ where }),
        ]);

        res.json({
          success: true,
          data: {
            data: items,
            total,
            page,
            pageSize,
          },
        });
      } catch (err) {
        next(err);
      }
    },
  ],

  unreadCount: [
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as AuthUser;
        const count = await notificationService.unreadCount(user.id);
        res.json({ success: true, data: { count } });
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

  markAllRead: [
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as AuthUser;
        await prisma.notification.updateMany({
          where: { recipientId: user.id, isRead: false },
          data: { isRead: true, readAt: new Date() },
        });
        res.json({ success: true, data: { marked: true } });
      } catch (err) {
        next(err);
      }
    },
  ],

  delete: [
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as AuthUser;
        await prisma.notification.deleteMany({
          where: { id: req.params.id, recipientId: user.id },
        });
        res.json({ success: true, data: { deleted: true } });
      } catch (err) {
        next(err);
      }
    },
  ],

  deleteAll: [
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as AuthUser;
        await prisma.notification.deleteMany({
          where: { recipientId: user.id },
        });
        res.json({ success: true, data: { deleted: true } });
      } catch (err) {
        next(err);
      }
    },
  ],
};
