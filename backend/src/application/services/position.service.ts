import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PositionFilters {
  departmentId?: string;
  level?: number;
  hasApprovalAuthority?: boolean;
  isActive?: boolean;
  search?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const positionService = {
  async getAll(
    filters: PositionFilters = {},
    page = 1,
    pageSize = 50,
  ): Promise<PaginatedResult<any>> {
    const skip = (page - 1) * pageSize;
    const where: any = {};

    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.level !== undefined) where.level = filters.level;
    if (filters.hasApprovalAuthority !== undefined)
      where.hasApprovalAuthority = filters.hasApprovalAuthority;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
        { jobDescription: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.position.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ departmentId: 'asc' }, { level: 'asc' }, { title: 'asc' }],
        include: {
          department: { select: { id: true, name: true, code: true } },
          _count: { select: { employees: true } },
        },
      }),
      prisma.position.count({ where }),
    ]);

    return { items, total, page, pageSize };
  },

  async getById(id: string) {
    const position = await prisma.position.findUnique({
      where: { id },
      include: {
        department: true,
        _count: { select: { employees: true } },
        employees: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
            email: true,
            user: { select: { isActive: true } },
          },
          take: 10,
        },
      },
    });

    if (!position) {
      throw new Error('Position not found');
    }

    return position;
  },

  async getByDepartment(departmentId: string) {
    return prisma.position.findMany({
      where: { departmentId },
      orderBy: [{ level: 'asc' }, { title: 'asc' }],
      include: {
        _count: { select: { employees: true } },
      },
    });
  },

  async getByCode(code: string) {
    return prisma.position.findUnique({
      where: { code },
      include: {
        department: { select: { id: true, name: true, code: true } },
      },
    });
  },

  async create(data: {
    title: string;
    code: string;
    departmentId: string;
    defaultRoleId?: string;
    reportsToId?: string;
    level?: number;
    hasApprovalAuthority?: boolean;
    maxApprovalAmount?: number;
    jobDescription?: string;
  }) {
    const position = await prisma.position.create({
      data: {
        title: data.title,
        code: data.code,
        departmentId: data.departmentId,
        defaultRoleId: data.defaultRoleId,
        reportsToId: data.reportsToId,
        level: data.level || 1,
        hasApprovalAuthority: data.hasApprovalAuthority || false,
        maxApprovalAmount: data.maxApprovalAmount,
        jobDescription: data.jobDescription,
        isActive: true,
      },
      include: {
        department: { select: { id: true, name: true, code: true } },
      },
    });

    return position;
  },

  async update(id: string, data: any) {
    const position = await prisma.position.findUnique({ where: { id } });
    if (!position) {
      throw new Error('Position not found');
    }

    return prisma.position.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.code && { code: data.code }),
        ...(data.departmentId && { departmentId: data.departmentId }),
        ...(data.defaultRoleId !== undefined && { defaultRoleId: data.defaultRoleId }),
        ...(data.reportsToId !== undefined && { reportsToId: data.reportsToId }),
        ...(data.level !== undefined && { level: data.level }),
        ...(data.hasApprovalAuthority !== undefined && {
          hasApprovalAuthority: data.hasApprovalAuthority,
        }),
        ...(data.maxApprovalAmount !== undefined && { maxApprovalAmount: data.maxApprovalAmount }),
        ...(data.jobDescription !== undefined && { jobDescription: data.jobDescription }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: {
        department: { select: { id: true, name: true, code: true } },
      },
    });
  },

  async delete(id: string) {
    const position = await prisma.position.findUnique({
      where: { id },
      include: { _count: { select: { employees: true } } },
    });

    if (!position) {
      throw new Error('Position not found');
    }

    if (position._count.employees > 0) {
      throw new Error('Cannot delete position with assigned employees');
    }

    await prisma.position.delete({ where: { id } });
    return { id };
  },

  async getApprovalAuthorities() {
    return prisma.position.findMany({
      where: { hasApprovalAuthority: true, isActive: true },
      include: {
        department: { select: { id: true, name: true, code: true } },
        _count: { select: { employees: true } },
      },
      orderBy: [{ departmentId: 'asc' }, { level: 'asc' }, { title: 'asc' }],
    });
  },

  async getStats() {
    const [total, active, inactive, withApprovalAuthority] = await Promise.all([
      prisma.position.count(),
      prisma.position.count({ where: { isActive: true } }),
      prisma.position.count({ where: { isActive: false } }),
      prisma.position.count({ where: { hasApprovalAuthority: true } }),
    ]);

    return { total, active, inactive, withApprovalAuthority };
  },
};
