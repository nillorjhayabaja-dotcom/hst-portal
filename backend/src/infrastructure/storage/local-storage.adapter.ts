import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { extname, join } from 'node:path';
import { Readable } from 'node:stream';
import { env } from '../config/env';
import { generateId } from '../../shared/utils';
import { logger } from '../logging/logger';

export const localStorageAdapter = {
  async save(
    file: { originalname: string; mimetype: string; size: number; stream: Readable },
    entityType: string,
    entityId: string,
  ) {
    const base = join(process.cwd(), env.upload.path, entityType, entityId);
    if (!existsSync(base)) mkdirSync(base, { recursive: true });
    const storedName = `${generateId()}${extname(file.originalname)}`;
    const fullPath = join(base, storedName);
    await pipeline(file.stream, createWriteStream(fullPath));
    const storagePath = join(env.upload.path, entityType, entityId, storedName);
    logger.info({ storagePath }, 'File stored');
    return {
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      storagePath,
    };
  },

  resolve(storagePath: string): string {
    return join(process.cwd(), storagePath);
  },
};
