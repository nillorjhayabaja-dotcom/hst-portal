// Base API Client with TanStack Query integration
import { QueryClient } from '@tanstack/react-query';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const accessToken = localStorage.getItem('hst.auth.accessToken');
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    if (response.status === 401) {
      // Clear auth and redirect to login
      localStorage.removeItem('hst.auth.accessToken');
      localStorage.removeItem('hst.auth.refreshToken');
      window.location.href = '/login';
      throw new Error('Your session has expired. Please log in again.');
    }
    throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || data;
}

export function getApiUrl(endpoint: string): string {
  return `${API_BASE}${endpoint}`;
}

export function getAuthHeaders(): Record<string, string> {
  const accessToken = localStorage.getItem('hst.auth.accessToken');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return headers;
}

export { fetchApi };