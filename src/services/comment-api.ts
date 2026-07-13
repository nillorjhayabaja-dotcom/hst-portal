// Comment API Service - Real backend integration
import { fetchApi } from './api-client';

export interface Comment {
  id: string;
  entityType: string;
  entityId: string;
  parentId?: string;
  authorId: string;
  authorName?: string;
  authorInitials?: string;
  content: string;
  mentions: string[];
  createdAt: string;
  updatedAt: string;
  replies?: Comment[];
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  entityType: string;
  entityId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  uploadedBy?: string;
  uploadedByName?: string;
  createdAt: string;
}

export const commentApi = {
  // Comments
  async getByEntity(entityType: string, entityId: string): Promise<Comment[]> {
    return fetchApi<Comment[]>(`/comments/${entityType}/${entityId}`);
  },

  async getById(id: string): Promise<Comment> {
    return fetchApi<Comment>(`/comments/${id}`);
  },

  async create(entityType: string, entityId: string, data: {
    content: string;
    parentId?: string;
    mentions?: string[];
  }): Promise<Comment> {
    return fetchApi<Comment>(`/comments/${entityType}/${entityId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: { content: string }): Promise<Comment> {
    return fetchApi<Comment>(`/comments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<void> {
    return fetchApi<void>(`/comments/${id}`, {
      method: 'DELETE',
    });
  },

  async getReplies(parentId: string): Promise<Comment[]> {
    return fetchApi<Comment[]>(`/comments/replies/${parentId}`);
  },
};