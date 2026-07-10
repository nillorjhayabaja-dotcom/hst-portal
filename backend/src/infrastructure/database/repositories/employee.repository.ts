import { prisma } from '../prisma.service';

export const employeeRepository = {
  async list(params: { skip?: number; take?: number; departmentId?: string } = {}) {
    const where = params.departmentId ? { departmentId: params.departmentId } : {};
    const [items, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        include: { department: true, position: true },
      }),
      prisma.employee.count({ where }),
    ]);
    return { items, total };
  },

  async findById(id: string) {
    return prisma.employee.findUnique({
      where: { id },
      include: { department: true, position: true, user: true },
    });
  },

  async findByUserId(userId: string) {
    return prisma.employee.findUnique({ where: { userId } });
  },

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
    return prisma.employee.create({ data });
  },

  async update(id: string, data: any) {
    return prisma.employee.update({ where: { id }, data });
  },
};
