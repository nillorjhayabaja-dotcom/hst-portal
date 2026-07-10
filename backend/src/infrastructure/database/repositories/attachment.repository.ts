import { prisma } from '../prisma.service';

export const attachmentRepository = {
  async listByEntity(entityType: string, entityId: string) {
    return prisma.attachment.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async create(data: {
    entityType: string;
    entityId: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    storagePath: string;
    storageType?: string;
    uploadedBy?: string;
  }) {
    return prisma.attachment.create({ data });
  },

  async delete(id: string) {
    return prisma.attachment.delete({ where: { id } });
  },
};
