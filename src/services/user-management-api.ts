import { API_BASE_URL, STORAGE_KEYS } from "@/config/environment";

const BASE = `${API_BASE_URL}/users/manage`;

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(url, {
    ...options,
    headers: { ...headers, ...(options?.headers || {}) },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    
    // Auto-logout on 401 Unauthorized (session invalidated by force logout, password reset, etc.)
    if (res.status === 401) {
      handleSessionInvalidation();
    }
    
    throw new Error(body?.error?.message || `Request failed (${res.status})`);
  }

  return res.json();
}

function handleSessionInvalidation() {
  // Clear all auth data
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  
  // Clear all queries if queryClient is available
  try {
    const { queryClient } = require('./api-client');
    queryClient.clear();
  } catch (e) {
    // Ignore if queryClient is not available
  }
  
  // Redirect to login page
  window.location.href = '/';
}

export interface UserSummary {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  onlineUsers: number;
  offlineUsers: number;
  lockedAccounts: number;
  temporaryPasswordUsers: number;
  passwordExpiringSoon: number;
  failedLoginAttemptsToday: number;
  newUsersThisMonth: number;
}

export interface UserRole {
  id: string;
  name: string;
  shortName: string | null;
}

export interface UserListItem {
  id: string;
  employeeId: string;
  displayName: string;
  email: string;
  department: string | null;
  departmentId: string | null;
  position: string | null;
  role: UserRole | null;
  isActive: boolean;
  isOnline: boolean;
  onlineStatus: string;
  isLocked: boolean;
  lockedUntil: string | null;
  lastLoginAt: string | null;
  lastActivityAt: string | null;
  passwordStatus: string;
  defaultPasswordUsed: boolean;
  mustChangePassword: boolean;
  passwordResetRequired: boolean;
  loginAttempts: number;
  activeSessions: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface UserDetail extends UserListItem {
  avatarUrl: string | null;
  lockedBy: string | null;
  lockReason: string | null;
  passwordChangedAt: string;
  passwordExpiresAt: string | null;
  suspendedAt: string | null;
  suspendedBy: string | null;
  suspendedReason: string | null;
  employee: {
    id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    title: string | null;
    department: string | null;
    departmentId: string | null;
    position: string | null;
    positionId: string | null;
    supervisor: { id: string; firstName: string; lastName: string } | null;
  } | null;
  role: (UserRole & { permissions: any[] }) | null;
  stats: {
    activeSessions: number;
    totalLogins: number;
    totalDevices: number;
    failedAttempts: number;
  };
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
  locked?: boolean;
  temporaryPassword?: boolean;
  neverLoggedIn?: boolean;
  dateCreatedFrom?: string;
  dateCreatedTo?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface UserSession {
  id: string;
  userId: string;
  sessionToken: string;
  refreshToken: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  location: string | null;
  isActive: boolean;
  lastActivity: string;
  expiresAt: string;
  createdAt: string;
}

export interface LoginHistoryEntry {
  id: string;
  userId: string;
  loginTime: string;
  logoutTime: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  location: string | null;
  success: boolean;
  failureReason: string | null;
  sessionDuration: number | null;
}

export interface UserDevice {
  id: string;
  userId: string;
  deviceName: string;
  deviceType: string;
  browser: string | null;
  os: string | null;
  ipAddress: string | null;
  lastUsed: string;
  isTrusted: boolean;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  actorId: string | null;
  actorName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  targetId: string | null;
  changes: any;
  ipAddress: string | null;
  userAgent: string | null;
  reason: string | null;
  createdAt: string;
}

export interface Role {
  id: string;
  name: string;
  shortName: string | null;
  level: number;
  description: string | null;
  isActive: boolean;
  permissions: { id: string; moduleId: string; actions: string[]; scope: string }[];
}

export interface Department {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  _count?: { positions: number };
}

export interface Position {
  id: string;
  title: string;
  code: string;
  departmentId: string;
  isActive: boolean;
}

export const userManagementApi = {
  async getDashboardSummary(): Promise<UserSummary> {
    const res = await request<{ success: boolean; data: UserSummary }>(
      `${BASE}/dashboard-summary`
    );
    return res.data;
  },

  async getUsers(filters: UserFilters = {}): Promise<{ data: UserListItem[]; pagination: Pagination }> {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.role) params.set("role", filters.role);
    if (filters.status) params.set("status", filters.status);
    if (filters.locked) params.set("locked", "true");
    if (filters.temporaryPassword) params.set("temporaryPassword", "true");
    if (filters.neverLoggedIn) params.set("neverLoggedIn", "true");
    if (filters.dateCreatedFrom) params.set("dateCreatedFrom", filters.dateCreatedFrom);
    if (filters.dateCreatedTo) params.set("dateCreatedTo", filters.dateCreatedTo);
    if (filters.page) params.set("page", String(filters.page));
    if (filters.pageSize) params.set("pageSize", String(filters.pageSize));
    if (filters.sortBy) params.set("sortBy", filters.sortBy);
    if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);

    const res = await request<{ success: boolean; data: UserListItem[]; pagination: Pagination }>(
      `${BASE}?${params.toString()}`
    );
    return { data: res.data, pagination: res.pagination };
  },

  async getUserById(id: string): Promise<UserDetail> {
    const res = await request<{ success: boolean; data: UserDetail }>(`${BASE}/${id}`);
    return res.data;
  },

  async createUser(input: {
    employeeId: string;
    email: string;
    displayName: string;
    roleIds: string[];
    departmentId?: string;
    positionId?: string;
  }): Promise<any> {
    const res = await request<{ success: boolean; data: any }>(`${BASE}`, {
      method: "POST",
      body: JSON.stringify(input),
    });
    return res.data;
  },

  async updateUser(
    id: string,
    input: { email?: string; displayName?: string; isActive?: boolean; roleIds?: string[] }
  ): Promise<UserDetail> {
    const res = await request<{ success: boolean; data: UserDetail }>(`${BASE}/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
    return res.data;
  },

  async resetPassword(id: string): Promise<{ success: boolean; message: string }> {
    const res = await request<{ success: boolean; data: { success: boolean; message: string } }>(`${BASE}/${id}/reset-password`, { method: "POST" });
    return res.data;
  },

  async toggleActive(id: string): Promise<{ success: boolean; message: string }> {
    const res = await request<{ success: boolean; data: { success: boolean; message: string } }>(`${BASE}/${id}/toggle-active`, { method: "POST" });
    return res.data;
  },

  async toggleLock(id: string): Promise<{ success: boolean; message: string }> {
    const res = await request<{ success: boolean; data: { success: boolean; message: string } }>(`${BASE}/${id}/toggle-lock`, { method: "POST" });
    return res.data;
  },

  async suspendUser(id: string, reason: string): Promise<{ success: boolean; message: string }> {
    const res = await request<{ success: boolean; data: { success: boolean; message: string } }>(`${BASE}/${id}/suspend`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
    return res.data;
  },

  async unsuspendUser(id: string): Promise<{ success: boolean; message: string }> {
    const res = await request<{ success: boolean; data: { success: boolean; message: string } }>(`${BASE}/${id}/unsuspend`, { method: "POST" });
    return res.data;
  },

  async forceLogout(id: string): Promise<{ success: boolean; message: string }> {
    const res = await request<{ success: boolean; data: { success: boolean; message: string } }>(`${BASE}/${id}/force-logout`, { method: "POST" });
    return res.data;
  },

  async changeUserRole(id: string, roleIds: string[]): Promise<{ success: boolean; message: string }> {
    const res = await request<{ success: boolean; data: { success: boolean; message: string } }>(`${BASE}/${id}/change-role`, {
      method: "POST",
      body: JSON.stringify({ roleIds }),
    });
    return res.data;
  },

  async getUserSessions(id: string): Promise<UserSession[]> {
    const res = await request<{ success: boolean; data: UserSession[] }>(`${BASE}/${id}/sessions`);
    return res.data;
  },

  async getLoginHistory(
    id: string,
    page = 1,
    pageSize = 20
  ): Promise<{ data: LoginHistoryEntry[]; pagination: Pagination }> {
    const res = await request<{ success: boolean; data: LoginHistoryEntry[]; pagination: Pagination }>(
      `${BASE}/${id}/login-history?page=${page}&pageSize=${pageSize}`
    );
    return { data: res.data, pagination: res.pagination };
  },

  async getUserDevices(id: string): Promise<UserDevice[]> {
    const res = await request<{ success: boolean; data: UserDevice[] }>(`${BASE}/${id}/devices`);
    return res.data;
  },

  async getAuditLogs(
    id: string,
    page = 1,
    pageSize = 20
  ): Promise<{ data: AuditLogEntry[]; pagination: Pagination }> {
    const res = await request<{ success: boolean; data: AuditLogEntry[]; pagination: Pagination }>(
      `${BASE}/${id}/audit-logs?page=${page}&pageSize=${pageSize}`
    );
    return { data: res.data, pagination: res.pagination };
  },

  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    const res = await request<{ success: boolean; data: { success: boolean; message: string } }>(`${BASE}/${id}`, { method: "DELETE" });
    return res.data;
  },

  async getRoles(): Promise<Role[]> {
    const res = await request<{ success: boolean; data: Role[] }>(`${BASE}/roles`);
    return res.data;
  },

  async getDepartments(): Promise<Department[]> {
    const res = await request<{ success: boolean; data: Department[] }>(`${BASE}/departments`);
    return res.data;
  },

  async getPositions(departmentId?: string): Promise<Position[]> {
    const url = departmentId ? `${BASE}/positions?departmentId=${departmentId}` : `${BASE}/positions`;
    const res = await request<{ success: boolean; data: Position[] }>(url);
    return res.data;
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const res = await request<{ success: boolean; data: { success: boolean; message: string } }>(`${BASE}/${userId}/change-password`, {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return res.data;
  },
};
