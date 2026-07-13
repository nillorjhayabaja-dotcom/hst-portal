// Configuration API Service - Real backend integration
import { fetchApi } from './api-client';

export interface CompanyProfile {
  id: string;
  name: string;
  legalName: string;
  logoUrl?: string;
  address?: string;
  tin?: string;
  contactNumber?: string;
  email?: string;
  website?: string;
  defaultTimezone: string;
  businessHoursStart: string;
  businessHoursEnd: string;
  workingDays: number[];
  fiscalYearStart: string;
  currency: string;
  currencySymbol: string;
  language: string;
  dateFormat: string;
  timeFormat: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  parentId?: string;
  headId?: string;
  description?: string;
  level: number;
  sortOrder: number;
  isActive: boolean;
}

export interface Position {
  id: string;
  title: string;
  code: string;
  departmentId: string;
  defaultRoleId?: string;
  reportsToId?: string;
  level: number;
  hasApprovalAuthority: boolean;
  maxApprovalAmount?: number;
  jobDescription?: string;
  isActive: boolean;
}

export interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  title?: string;
  departmentId?: string;
  positionId?: string;
  supervisorId?: string;
  hireDate: string;
  status: string;
  avatarUrl?: string;
}

export interface SystemSetting {
  key: string;
  value: string;
  category: string;
  description?: string;
  settingType: string;
  options?: any;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: string;
  isRecurring: boolean;
  departmentId?: string;
  description?: string;
}

export interface BusinessRule {
  id: string;
  name: string;
  description?: string;
  moduleId: string;
  priority: number;
  conditions: any;
  actions: any;
  isActive: boolean;
}

export const configApi = {
  // Company Profile
  async getCompanyProfile(): Promise<CompanyProfile> {
    return fetchApi<CompanyProfile>('/company');
  },

  async updateCompanyProfile(data: Partial<CompanyProfile>): Promise<CompanyProfile> {
    return fetchApi<CompanyProfile>('/company', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Departments
  async getDepartments(): Promise<Department[]> {
    return fetchApi<Department[]>('/departments');
  },

  async getDepartmentById(id: string): Promise<Department> {
    return fetchApi<Department>(`/departments/${id}`);
  },

  async createDepartment(data: Omit<Department, 'id'>): Promise<Department> {
    return fetchApi<Department>('/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateDepartment(id: string, data: Partial<Department>): Promise<Department> {
    return fetchApi<Department>(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteDepartment(id: string): Promise<void> {
    return fetchApi<void>(`/departments/${id}`, {
      method: 'DELETE',
    });
  },

  // Positions
  async getPositions(): Promise<Position[]> {
    return fetchApi<Position[]>('/positions');
  },

  async getPositionById(id: string): Promise<Position> {
    return fetchApi<Position>(`/positions/${id}`);
  },

  async createPosition(data: Omit<Position, 'id'>): Promise<Position> {
    return fetchApi<Position>('/positions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updatePosition(id: string, data: Partial<Position>): Promise<Position> {
    return fetchApi<Position>(`/positions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deletePosition(id: string): Promise<void> {
    return fetchApi<void>(`/positions/${id}`, {
      method: 'DELETE',
    });
  },

  // Employees
  async getEmployees(filters?: { departmentId?: string; status?: string; search?: string }): Promise<Employee[]> {
    const params = new URLSearchParams();
    if (filters?.departmentId) params.append('departmentId', filters.departmentId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    
    const query = params.toString();
    return fetchApi<Employee[]>(`/employees${query ? `?${query}` : ''}`);
  },

  async getEmployeeById(id: string): Promise<Employee> {
    return fetchApi<Employee>(`/employees/${id}`);
  },

  async createEmployee(data: Omit<Employee, 'id'>): Promise<Employee> {
    return fetchApi<Employee>('/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateEmployee(id: string, data: Partial<Employee>): Promise<Employee> {
    return fetchApi<Employee>(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteEmployee(id: string): Promise<void> {
    return fetchApi<void>(`/employees/${id}`, {
      method: 'DELETE',
    });
  },

  // System Settings
  async getSettings(category?: string): Promise<SystemSetting[]> {
    const query = category ? `?category=${category}` : '';
    return fetchApi<SystemSetting[]>(`/settings${query}`);
  },

  async getSetting(key: string): Promise<SystemSetting> {
    return fetchApi<SystemSetting>(`/settings/${key}`);
  },

  async updateSetting(key: string, value: string): Promise<SystemSetting> {
    return fetchApi<SystemSetting>(`/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
  },

  async updateSettings(settings: Array<{ key: string; value: string }>): Promise<void> {
    return fetchApi<void>('/settings/batch', {
      method: 'PUT',
      body: JSON.stringify({ settings }),
    });
  },

  // Holidays
  async getHolidays(year?: number): Promise<Holiday[]> {
    const query = year ? `?year=${year}` : '';
    return fetchApi<Holiday[]>(`/holidays${query}`);
  },

  async createHoliday(data: Omit<Holiday, 'id'>): Promise<Holiday> {
    return fetchApi<Holiday>('/holidays', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateHoliday(id: string, data: Partial<Holiday>): Promise<Holiday> {
    return fetchApi<Holiday>(`/holidays/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteHoliday(id: string): Promise<void> {
    return fetchApi<void>(`/holidays/${id}`, {
      method: 'DELETE',
    });
  },

  // Business Rules
  async getBusinessRules(moduleId?: string): Promise<BusinessRule[]> {
    const query = moduleId ? `?moduleId=${moduleId}` : '';
    return fetchApi<BusinessRule[]>(`/business-rules${query}`);
  },

  async createBusinessRule(data: Omit<BusinessRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<BusinessRule> {
    return fetchApi<BusinessRule>('/business-rules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateBusinessRule(id: string, data: Partial<BusinessRule>): Promise<BusinessRule> {
    return fetchApi<BusinessRule>(`/business-rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteBusinessRule(id: string): Promise<void> {
    return fetchApi<void>(`/business-rules/${id}`, {
      method: 'DELETE',
    });
  },

  async toggleBusinessRule(id: string): Promise<BusinessRule> {
    return fetchApi<BusinessRule>(`/business-rules/${id}/toggle`, {
      method: 'POST',
    });
  },
};