import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export abstract class BaseRepository<T> {
  protected prisma = prisma;

  async getAll(): Promise<T[]> {
    // Implementation coming in Sprint 3
    return [];
  }

  async getById(id: string): Promise<T | null> {
    // Implementation coming in Sprint 3
    return null;
  }

  async create(data: Partial<T>): Promise<T> {
    // Implementation coming in Sprint 3
    return data as T;
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    // Implementation coming in Sprint 3
    return data as T;
  }

  async delete(id: string): Promise<void> {
    // Implementation coming in Sprint 3
  }
}
