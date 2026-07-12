import { prisma } from '../prisma.service';

export const notificationRepository = {
  async create(data: {
    type: string;
    title: string;
    message?: string;
    recipientId: string;
    requestId?: string;
    controlNumber?: string;
    moduleId?: string;
    actionUrl?: string;
    channel?: string;
  }, tx?: import('@prisma/client').Prisma.TransactionClient) {
    const client = tx || prisma;
    return client.notification.create({ data });
  },

  async listForUser(recipientId: string, unreadOnly = false) {
    return prisma.notification.findMany({
      where: { recipientId, ...(unreadOnly ? { isRead: false } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  },

  async markRead(id: string, recipientId: string) {
    return prisma.notification.updateMany({
      where: { id, recipientId },
      data: { isRead: true, readAt: new Date() },
    });
  },

  async unreadCount(recipientId: string) {
    return prisma.notification.count({ where: { recipientId, isRead: false } });
  },
};

export const notificationRuleRepository = {
  async findByEvent(moduleId: string, event: string) {
    return prisma.notificationRule.findMany({
      where: { moduleId, event, isActive: true },
    });
  },
};
