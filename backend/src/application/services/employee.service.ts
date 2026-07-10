import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface EmployeeFilters {
  departmentId?: string;
  positionId?: string;
  status?: string;
  search?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export class EmployeeService {
  async getAll(
    filters: EmployeeFilters = {},
    page = 1,
    pageSize = 20,
  ): Promise<PaginatedResult<any>> {
    const skip = (page - 1) * pageSize;
    const where: any = {};

    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.positionId) where.positionId = filters.positionId;
    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { employeeNumber: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        include: {
          department: true,
          position: { include: { department: true } },
          user: { select: { email: true, isActive: true, lastLoginAt: true } },
          supervisor: { select: { firstName: true, lastName: true, employeeNumber: true } },
        },
      }),
      prisma.employee.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async getById(id: string) {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        position: { include: { department: true } },
        user: true,
        supervisor: {
          select: { id: true, firstName: true, lastName: true, employeeNumber: true, email: true },
        },
        subordinates: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
            position: { select: { title: true } },
          },
        },
        leaveBalances: true,
      },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    return employee;
  }

  async getByUserId(userId: string) {
    return prisma.employee.findUnique({
      where: { userId },
      include: { department: true, position: true },
    });
  }

  async getTeam(employeeId: string) {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    return prisma.employee.findMany({
      where: { supervisorId: employeeId },
      include: {
        department: true,
        position: true,
        user: { select: { email: true, isActive: true } },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
  }

  async getSupervisor(employeeId: string) {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        supervisor: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
            email: true,
            position: { select: { title: true } },
            department: { select: { name: true } },
          },
        },
      },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    return employee.supervisor;
  }

  async create(data: {
    employeeNumber: string;
    userId?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    title?: string;
    departmentId?: string;
    positionId?: string;
    supervisorId?: string;
    hireDate: Date;
    status?: string;
  }) {
    const employee = await prisma.employee.create({
      data: {
        employeeNumber: data.employeeNumber,
        userId: data.userId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        title: data.title,
        departmentId: data.departmentId,
        positionId: data.positionId,
        supervisorId: data.supervisorId,
        hireDate: data.hireDate,
        status: data.status || 'active',
      },
      include: {
        department: true,
        position: true,
        user: true,
      },
    });

    return employee;
  }

  async update(id: string, data: any) {
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      throw new Error('Employee not found');
    }

    return prisma.employee.update({
      where: { id },
      data: {
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        ...(data.email && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.departmentId !== undefined && { departmentId: data.departmentId }),
        ...(data.positionId !== undefined && { positionId: data.positionId }),
        ...(data.supervisorId !== undefined && { supervisorId: data.supervisorId }),
        ...(data.status && { status: data.status }),
      },
      include: {
        department: true,
        position: true,
        user: true,
      },
    });
  }

  async delete(id: string) {
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      throw new Error('Employee not found');
    }

    await prisma.employee.delete({ where: { id } });
    return { id };
  }

  async getOrgChart(departmentId?: string) {
    const where = departmentId ? { departmentId } : {};

    const employees = await prisma.employee.findMany({
      where: { ...where, status: 'active' },
      include: {
        user: { select: { displayName: true, avatarUrl: true } },
        position: { select: { title: true } },
        department: { select: { name: true } },
        supervisor: { select: { id: true, firstName: true, lastName: true } },
        subordinates: {
          where: { status: 'active' },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
            position: { select: { title: true } },
            user: { select: { displayName: true, avatarUrl: true } },
          },
        },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });

    return employees;
  }
}
