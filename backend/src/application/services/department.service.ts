import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface DepartmentFilters {
  parentId?: string;
  isActive?: boolean;
  search?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const departmentService = {
  async getAll(
    filters: DepartmentFilters = {},
    page = 1,
    pageSize = 50,
  ): Promise<PaginatedResult<any>> {
    const skip = (page - 1) * pageSize;
    const where: any = {};

    if (filters.parentId !== undefined) where.parentId = filters.parentId;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.department.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
        include: {
          parent: { select: { id: true, name: true, code: true } },
          _count: { select: { employees: true, positions: true, children: true } },
        },
      }),
      prisma.department.count({ where }),
    ]);

    return { items, total, page, pageSize };
  },

  async getTree(parentId?: string) {
    const where = parentId ? { parentId } : { parentId: null };

    const departments = await prisma.department.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { employees: true, positions: true } },
        children: {
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          include: {
            _count: { select: { employees: true, positions: true } },
          },
        },
      },
    });

    return departments;
  },

  async getById(id: string) {
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true, code: true } },
        children: {
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          include: {
            _count: { select: { employees: true, positions: true } },
          },
        },
        positions: {
          orderBy: [{ level: 'asc' }, { title: 'asc' }],
          include: { _count: { select: { employees: true } } },
        },
        employees: {
          orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
          include: {
            user: { select: { email: true, isActive: true } },
            position: { select: { title: true } },
          },
        },
        _count: { select: { employees: true, positions: true, visitors: true, holidays: true } },
      },
    });

    if (!department) {
      throw new Error('Department not found');
    }

    return department;
  },

  async getByCode(code: string) {
    return prisma.department.findUnique({
      where: { code },
      include: {
        parent: { select: { id: true, name: true, code: true } },
      },
    });
  },

  async create(data: {
    name: string;
    code: string;
    parentId?: string;
    headId?: string;
    description?: string;
    level?: number;
    sortOrder?: number;
  }) {
    const department = await prisma.department.create({
      data: {
        name: data.name,
        code: data.code,
        parentId: data.parentId,
        headId: data.headId,
        description: data.description,
        level: data.level || 1,
        sortOrder: data.sortOrder || 0,
        isActive: true,
      },
      include: {
        parent: { select: { id: true, name: true, code: true } },
      },
    });

    return department;
  },

  async update(id: string, data: any) {
    const department = await prisma.department.findUnique({ where: { id } });
    if (!department) {
      throw new Error('Department not found');
    }

    return prisma.department.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.code && { code: data.code }),
        ...(data.parentId !== undefined && { parentId: data.parentId }),
        ...(data.headId !== undefined && { headId: data.headId }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.level !== undefined && { level: data.level }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: {
        parent: { select: { id: true, name: true, code: true } },
      },
    });
  },

  async delete(id: string) {
    const department = await prisma.department.findUnique({
      where: { id },
      include: { _count: { select: { employees: true, positions: true, children: true } } },
    });

    if (!department) {
      throw new Error('Department not found');
    }

    if (
      department._count.employees > 0 ||
      department._count.positions > 0 ||
      department._count.children > 0
    ) {
      throw new Error(
        'Cannot delete department with existing employees, positions, or sub-departments',
      );
    }

    await prisma.department.delete({ where: { id } });
    return { id };
  },

  async getHeads() {
    return prisma.department.findMany({
      where: { headId: { not: null } },
      orderBy: [{ name: 'asc' }],
    });
  },

  async getStats() {
    const [total, active, inactive, withHead, withoutHead] = await Promise.all([
      prisma.department.count(),
      prisma.department.count({ where: { isActive: true } }),
      prisma.department.count({ where: { isActive: false } }),
      prisma.department.count({ where: { headId: { not: null } } }),
      prisma.department.count({ where: { headId: null } }),
    ]);

    return { total, active, inactive, withHead, withoutHead };
  },
};
