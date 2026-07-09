import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class NotificationService {
  async getAll(userId: string) {
    // Implementation coming in Sprint 6
    return [];
  }

  async getUnreadCount(userId: string) {
    // Implementation coming in Sprint 6
    return { count: 0 };
  }

  async markAsRead(id: string, userId: string) {
    // Implementation coming in Sprint 6
    return { id };
  }

  async markAllAsRead(userId: string) {
    // Implementation coming in Sprint 6
    return true;
  }
}