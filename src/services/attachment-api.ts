// Attachment API Service - Real backend integration
import { fetchApi } from './api-client';
import { API_BASE_URL, getAuthHeaders, STORAGE_KEYS } from '@/config/environment';

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

    const response = await fetch(`${API_BASE_URL}/attachments/upload`, {
      method: 'POST',
      body: formData,
      headers: getAuthHeaders(),
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
    const response = await fetch(`${API_BASE_URL}/attachments/${id}/download`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.blob();
  },

  async getDownloadUrl(id: string): Promise<string> {
    const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    return `${API_BASE_URL}/attachments/${id}/download?token=${accessToken}`;
  },
};