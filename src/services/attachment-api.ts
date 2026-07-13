// Attachment API Service - Real backend integration
import { fetchApi } from './api-client';

export interface Attachment {
  id: string;
  entityType: string;
  entityId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  storageType: string;
  uploadedBy?: string;
  uploadedByName?: string;
  createdAt: string;
}

export const attachmentApi = {
  async getByEntity(entityType: string, entityId: string): Promise<Attachment[]> {
    return fetchApi<Attachment[]>(`/attachments/${entityType}/${entityId}`);
  },

  async getById(id: string): Promise<Attachment> {
    return fetchApi<Attachment>(`/attachments/${id}`);
  },

  async upload(entityType: string, entityId: string, file: File): Promise<Attachment> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);

    const accessToken = localStorage.getItem('hst.auth.accessToken');
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'}/attachments/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  },

  async delete(id: string): Promise<void> {
    return fetchApi<void>(`/attachments/${id}`, {
      method: 'DELETE',
    });
  },

  async download(id: string): Promise<Blob> {
    const accessToken = localStorage.getItem('hst.auth.accessToken');
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'}/attachments/${id}/download`, {
      headers: {
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.blob();
  },

  async getDownloadUrl(id: string): Promise<string> {
    const accessToken = localStorage.getItem('hst.auth.accessToken');
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
    return `${baseUrl}/attachments/${id}/download?token=${accessToken}`;
  },
};