// Base API Client with TanStack Query integration
import { QueryClient } from '@tanstack/react-query';
import { API_BASE_URL, API_BASE_NORMALIZED, getAuthHeaders, STORAGE_KEYS } from '@/config/environment';
import { useAuth } from '@/contexts/AuthContext';

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
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Add cache-busting parameter for GET requests
  const urlWithCacheBust = endpoint.includes('?') 
    ? `${endpoint}&_t=${Date.now()}` 
    : `${endpoint}?_t=${Date.now()}`;
  
  const response = await fetch(`${API_BASE_URL}${urlWithCacheBust}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      ...getAuthHeaders(),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    
    // Auto-logout on 401 Unauthorized (session invalidated by force logout, password reset, etc.)
    if (response.status === 401) {
      handleSessionInvalidation();
    }
    
    throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || data;
}

function handleSessionInvalidation() {
  // Clear all auth data
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  
  // Clear all queries
  queryClient.clear();
  
  // Redirect to login page
  window.location.href = '/';
}

export function getApiUrl(endpoint: string): string {
  return `${API_BASE_URL}${endpoint}`;
}

export { fetchApi };
