import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface RoleFilters {
  level?: number;
  isActive?: boolean;
  search?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const roleService = {
  async getAll(filters: RoleFilters = {}, page = 1, pageSize = 50): Promise<PaginatedResult<any>> {
    const skip = (page - 1) * pageSize;
    const where: any = {};

    if (filters.level !== undefined) where.level = filters.level;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { shortName: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.role.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ level: 'asc' }, { name: 'asc' }],
        include: {
          permissions: true,
          _count: { select: { userRoles: true, workflowSteps: true, approvalSteps: true } },
        },
      }),
      prisma.role.count({ where }),
    ]);

    return { items, total, page, pageSize };
  },

  async getById(id: string) {
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: true,
        userRoles: {
          include: {
            user: { select: { id: true, employeeId: true, displayName: true, email: true } },
          },
        },
        workflowSteps: {
          include: { workflow: { select: { id: true, name: true, moduleId: true } } },
        },
        approvalSteps: {
          include: { request: { select: { id: true, controlNumber: true, title: true } } },
        },
      },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    return role;
  },

  async getPermissions(id: string) {
    const role = await prisma.role.findUnique({
      where: { id },
      include: { permissions: true },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    return role.permissions;
  },

  async setPermissions(
    id: string,
    permissions: Array<{ moduleId: string; actions: string[]; scope: string }>,
  ) {
    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new Error('Role not found');
    }

    await prisma.permission.deleteMany({ where: { roleId: id } });

    await prisma.permission.createMany({
      data: permissions.map((perm) => ({
        roleId: id,
        moduleId: perm.moduleId,
        actions: perm.actions,
        scope: perm.scope,
      })),
    });

    return { id };
  },

  async create(data: {
    name: string;
    shortName?: string;
    level?: number;
    description?: string;
    permissions?: Array<{ moduleId: string; actions: string[]; scope: string }>;
  }) {
    const role = await prisma.role.create({
      data: {
        name: data.name,
        shortName: data.shortName,
        level: data.level || 9,
        description: data.description,
        isActive: true,
        permissions: data.permissions
          ? {
              create: data.permissions.map((perm) => ({
                moduleId: perm.moduleId,
                actions: perm.actions,
                scope: perm.scope,
              })),
            }
          : undefined,
      },
      include: { permissions: true },
    });

    return role;
  },

  async update(id: string, data: any) {
    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new Error('Role not found');
    }

    const updateData: any = {
      ...(data.name && { name: data.name }),
      ...(data.shortName !== undefined && { shortName: data.shortName }),
      ...(data.level !== undefined && { level: data.level }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    };

    if (data.permissions) {
      await prisma.permission.deleteMany({ where: { roleId: id } });
      updateData.permissions = {
        create: data.permissions.map((perm: any) => ({
          moduleId: perm.moduleId,
          actions: perm.actions,
          scope: perm.scope,
        })),
      };
    }

    return prisma.role.update({
      where: { id },
      data: updateData,
      include: { permissions: true },
    });
  },

  async delete(id: string) {
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        _count: { select: { userRoles: true, workflowSteps: true, approvalSteps: true } },
      },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    if (
      role._count.userRoles > 0 ||
      role._count.workflowSteps > 0 ||
      role._count.approvalSteps > 0
    ) {
      throw new Error('Cannot delete role that is assigned to users or used in workflows');
    }

    await prisma.role.delete({ where: { id } });
    return { id };
  },

  async getStats() {
    const [total, active, inactive] = await Promise.all([
      prisma.role.count(),
      prisma.role.count({ where: { isActive: true } }),
      prisma.role.count({ where: { isActive: false } }),
    ]);

    return { total, active, inactive };
  },
};
