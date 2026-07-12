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
    const createData: any = {
      action: data.action,
      entityType: data.entityType,
    };
    
    if (data.actorId !== undefined) {
      createData.actorId = data.actorId;
    }
    if (data.actorName !== undefined) {
      createData.actorName = data.actorName;
    }
    if (data.entityId !== undefined) {
      createData.entityId = data.entityId;
    }
    if (data.targetId !== undefined) {
      createData.targetId = data.targetId;
    }
    if (data.changes !== undefined) {
      createData.changes = data.changes;
    }
    if (data.ipAddress !== undefined) {
      createData.ipAddress = data.ipAddress;
    }
    if (data.userAgent !== undefined) {
      createData.userAgent = data.userAgent;
    }
    if (data.metadata !== undefined) {
      createData.metadata = data.metadata;
    }
    
    return prisma.auditLog.create({ data: createData });
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
