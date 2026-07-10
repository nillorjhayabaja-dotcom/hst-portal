import { prisma } from '../prisma.service';

export const roleRepository = {
  async list() {
    return prisma.role.findMany({ orderBy: { level: 'asc' } });
  },

  async findById(id: string) {
    return prisma.role.findUnique({ where: { id }, include: { permissions: true } });
  },

  async create(data: {
    id: string;
    name: string;
    shortName?: string;
    level: number;
    description?: string;
  }) {
    return prisma.role.create({ data });
  },

  async setPermissions(
    roleId: string,
    permissions: { moduleId: string; actions: string[]; scope: string }[],
  ) {
    return prisma.$transaction(async (tx: import('@prisma/client').Prisma.TransactionClient) => {
      await tx.permission.deleteMany({ where: { roleId } });
      if (permissions.length) {
        await tx.permission.createMany({
          data: permissions.map((p) => ({ roleId, ...p })),
        });
      }
    });
  },
};

export const permissionRepository = {
  async listByRole(roleId: string) {
    return prisma.permission.findMany({ where: { roleId } });
  },
};
