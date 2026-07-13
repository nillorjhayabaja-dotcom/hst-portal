// Search API Service - Real backend integration
import { fetchApi } from './api-client';

export interface SearchResult {
  id: string;
  type: 'module' | 'employee' | 'request' | 'department' | 'control-number';
  label: string;
  description: string;
  icon?: string;
  to?: string;
  badge?: string;
}

export interface SearchFilters {
  query?: string;
  types?: string[];
  departmentId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export const searchApi = {
  async search(filters: SearchFilters): Promise<{ data: SearchResult[]; total: number; page: number; pageSize: number }> {
    const params = new URLSearchParams();
    if (filters.query) params.append('q', filters.query);
    if (filters.types?.length) params.append('types', filters.types.join(','));
    if (filters.departmentId) params.append('departmentId', filters.departmentId);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.pageSize) params.append('pageSize', String(filters.pageSize));

    const query = params.toString();
    return fetchApi<{ data: SearchResult[]; total: number; page: number; pageSize: number }>(
      `/search${query ? `?${query}` : ''}`
    );
  },

  async searchEmployees(query: string, filters?: { departmentId?: string; status?: string }): Promise<any[]> {
    const params = new URLSearchParams();
    params.append('q', query);
    if (filters?.departmentId) params.append('departmentId', filters.departmentId);
    if (filters?.status) params.append('status', filters.status);
    
    return fetchApi<any[]>(`/search/employees?${params.toString()}`);
  },

  async searchRequests(query: string, filters?: { moduleId?: string; status?: string }): Promise<any[]> {
    const params = new URLSearchParams();
    params.append('q', query);
    if (filters?.moduleId) params.append('moduleId', filters.moduleId);
    if (filters?.status) params.append('status', filters.status);
    
    return fetchApi<any[]>(`/search/requests?${params.toString()}`);
  },

  async searchDepartments(query: string): Promise<any[]> {
    return fetchApi<any[]>(`/search/departments?q=${encodeURIComponent(query)}`);
  },

  async getRecentSearches(userId: string, limit: number = 10): Promise<string[]> {
    return fetchApi<string[]>(`/search/recent/${userId}?limit=${limit}`);
  },

  async saveSearch(userId: string, query: string, type: string): Promise<void> {
    return fetchApi<void>(`/search/save`, {
      method: 'POST',
      body: JSON.stringify({ userId, query, type }),
    });
  },

  async getPopularSearches(limit: number = 10): Promise<Array<{ query: string; count: number }>> {
    return fetchApi<Array<{ query: string; count: number }>>(`/search/popular?limit=${limit}`);
  },
};