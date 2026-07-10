import { prisma } from '../prisma.service';

export const departmentRepository = {
  async list() {
    return prisma.department.findMany({
      orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { employees: true } } },
    });
  },

  async findById(id: string) {
    return prisma.department.findUnique({ where: { id } });
  },

  async create(data: {
    name: string;
    code: string;
    parentId?: string | null;
    headId?: string | null;
    description?: string;
    level?: number;
    sortOrder?: number;
  }) {
    return prisma.department.create({ data });
  },

  async update(id: string, data: any) {
    return prisma.department.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.department.delete({ where: { id } });
  },
};
