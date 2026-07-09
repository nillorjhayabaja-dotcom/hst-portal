import { prisma } from '../prisma.service';

export const auditRepository = {
  async log(data: {
    actorId?: string;
    actorName?: string;
    action: string;
    entityType: string;
    entityId?: string;
    targetId?: string;
    changes?: unknown;
    ipAddress?: string;
    userAgent?: string;
    metadata?: unknown;
  }) {
    return prisma.auditLog.create({ data });
  },

  async list(params: { skip?: number; take?: number; entityType?: string; actorId?: string } = {}) {
    const where: any = {};
    if (params.entityType) where.entityType = params.entityType;
    if (params.actorId) where.actorId = params.actorId;
    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);
    return { items, total };
  },
};