// Notification API Service - Real backend integration
import { fetchApi } from './api-client';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message?: string;
  recipientId: string;
  requestId?: string;
  controlNumber?: string;
  moduleId?: string;
  actionUrl?: string;
  isRead: boolean;
  readAt?: string;
  channel: string;
  sentAt?: string;
  createdAt: string;
}

export interface NotificationRule {
  id: string;
  moduleId: string;
  event: string;
  notifyRoleIds: string[];
  notifyUserIds: string[];
  channels: string[];
  templateSubject: string;
  templateBody: string;
  isActive: boolean;
}

export const notificationApi = {
  // Notifications
  async getAll(filters?: {
    isRead?: boolean;
    moduleId?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ data: Notification[]; total: number; page: number; pageSize: number }> {
    const params = new URLSearchParams();
    if (filters?.isRead !== undefined) params.append('isRead', String(filters.isRead));
    if (filters?.moduleId) params.append('moduleId', filters.moduleId);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.pageSize) params.append('pageSize', String(filters.pageSize));
    
    const query = params.toString();
    return fetchApi<{ data: Notification[]; total: number; page: number; pageSize: number }>(
      `/notifications${query ? `?${query}` : ''}`
    );
  },

  async getById(id: string): Promise<Notification> {
    return fetchApi<Notification>(`/notifications/${id}`);
  },

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    return fetchApi<{ count: number }>(`/notifications/unread-count/${userId}`);
  },

  async markAsRead(id: string): Promise<void> {
    return fetchApi<void>(`/notifications/${id}/read`, {
      method: 'POST',
    });
  },

  async markAllAsRead(userId: string): Promise<void> {
    return fetchApi<void>(`/notifications/mark-all-read/${userId}`, {
      method: 'POST',
    });
  },

  async delete(id: string): Promise<void> {
    return fetchApi<void>(`/notifications/${id}`, {
      method: 'DELETE',
    });
  },

  async deleteAll(userId: string): Promise<void> {
    return fetchApi<void>(`/notifications/delete-all/${userId}`, {
      method: 'DELETE',
    });
  },

  // Notification Rules
  async getRules(): Promise<NotificationRule[]> {
    return fetchApi<NotificationRule[]>('/notification-rules');
  },

  async getRuleById(id: string): Promise<NotificationRule> {
    return fetchApi<NotificationRule>(`/notification-rules/${id}`);
  },

  async createRule(rule: Omit<NotificationRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<NotificationRule> {
    return fetchApi<NotificationRule>('/notification-rules', {
      method: 'POST',
      body: JSON.stringify(rule),
    });
  },

  async updateRule(id: string, updates: Partial<NotificationRule>): Promise<NotificationRule> {
    return fetchApi<NotificationRule>(`/notification-rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteRule(id: string): Promise<void> {
    return fetchApi<void>(`/notification-rules/${id}`, {
      method: 'DELETE',
    });
  },

  async toggleRule(id: string): Promise<NotificationRule> {
    return fetchApi<NotificationRule>(`/notification-rules/${id}/toggle`, {
      method: 'POST',
    });
  },
};