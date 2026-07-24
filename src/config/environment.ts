/**
 * Centralized Environment Configuration
 * All environment variables should be accessed through this file
 */

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

// Normalize API base URL by removing trailing /api/v1 if present
export const API_BASE_NORMALIZED = API_BASE_URL.replace(/\/?api\/?v1\/?$/i, '');

// Application Configuration
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'HST Enterprise Portal';
export const APP_ENV = import.meta.env.VITE_ENV || 'development';

// Feature Flags
export const ENABLE_ANALYTICS = import.meta.env.VITE_ENABLE_ANALYTICS === 'true';
export const ENABLE_DEBUG = import.meta.env.VITE_ENABLE_DEBUG === 'true';

// API Timeouts (in milliseconds)
export const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10);
export const API_RETRY_ATTEMPTS = parseInt(import.meta.env.VITE_API_RETRY_ATTEMPTS || '3', 10);

// Storage Keys
export const STORAGE_KEYS = {
  USER: 'hst.auth.user',
  ACCESS_TOKEN: 'hst.auth.accessToken',
  REFRESH_TOKEN: 'hst.auth.refreshToken',
  MUST_CHANGE_PASSWORD: 'hst.auth.mustChangePassword',
} as const;

// Helper function to get full API URL
export function getApiUrl(endpoint: string): string {
  return `${API_BASE_URL}${endpoint}`;
}

// Helper function to get auth headers
export function getAuthHeaders(includeJsonContentType = true): Record<string, string> {
  const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const headers: Record<string, string> = {};
  
  if (includeJsonContentType) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  return headers;
}

// Environment checks
export const isProduction = APP_ENV === 'production';
export const isDevelopment = APP_ENV === 'development';
export const isTest = APP_ENV === 'test';