import { Readable } from 'node:stream';
import { localStorageAdapter } from './local-storage.adapter';
import { attachmentRepository } from '../database/repositories/attachment.repository';

export const fileStorageService = {
  async upload(
    file: { originalname: string; mimetype: string; size: number; stream: Readable },
    entityType: string,
    entityId: string,
    uploadedBy?: string,
  ) {
    const meta = await localStorageAdapter.save(file, entityType, entityId);
    return attachmentRepository.create({ ...meta, entityType, entityId, uploadedBy });
  },

  async list(entityType: string, entityId: string) {
    return attachmentRepository.listByEntity(entityType, entityId);
  },

  async remove(id: string, _userId?: string) {
    return attachmentRepository.delete(id);
  },
};
