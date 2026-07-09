import { BaseRepository } from './base.repository';

export class NotificationRepository extends BaseRepository<any> {
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