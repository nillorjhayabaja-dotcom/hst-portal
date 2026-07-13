// Employee API Service - Real backend integration
import { fetchApi } from './api-client';

export interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  title?: string;
  departmentId?: string;
  departmentName?: string;
  positionId?: string;
  positionTitle?: string;
  supervisorId?: string;
  supervisorName?: string;
  hireDate: string;
  status: string;
  avatarUrl?: string;
  role?: string;
}

export const employeeApi = {
  async getAll(filters?: {
    departmentId?: string;
    status?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ data: Employee[]; total: number; page: number; pageSize: number }> {
    const params = new URLSearchParams();
    if (filters?.departmentId) params.append('departmentId', filters.departmentId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.pageSize) params.append('pageSize', String(filters.pageSize));
    
    const query = params.toString();
    return fetchApi<{ data: Employee[]; total: number; page: number; pageSize: number }>(
      `/employees${query ? `?${query}` : ''}`
    );
  },

  async getById(id: string): Promise<Employee> {
    return fetchApi<Employee>(`/employees/${id}`);
  },

  async getByEmployeeNumber(employeeNumber: string): Promise<Employee> {
    return fetchApi<Employee>(`/employees/number/${employeeNumber}`);
  },

  async getByDepartment(departmentId: string): Promise<Employee[]> {
    return fetchApi<Employee[]>(`/employees/department/${departmentId}`);
  },

  async getSubordinates(supervisorId: string): Promise<Employee[]> {
    return fetchApi<Employee[]>(`/employees/supervisor/${supervisorId}`);
  },

  async create(data: Omit<Employee, 'id'>): Promise<Employee> {
    return fetchApi<Employee>('/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: Partial<Employee>): Promise<Employee> {
    return fetchApi<Employee>(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<void> {
    return fetchApi<void>(`/employees/${id}`, {
      method: 'DELETE',
    });
  },

  async updateStatus(id: string, status: string): Promise<Employee> {
    return fetchApi<Employee>(`/employees/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },
};