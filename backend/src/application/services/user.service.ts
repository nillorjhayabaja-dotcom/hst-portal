import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class UserService {
  async getAll() {
    // Implementation coming in Sprint 3
    return [];
  }

  async getById(id: string) {
    // Implementation coming in Sprint 3
    return { id };
  }

  async create(data: any) {
    // Implementation coming in Sprint 3
    return { id: 'new-id' };
  }

  async update(id: string, data: any) {
    // Implementation coming in Sprint 3
    return { id };
  }

  async delete(id: string) {
    // Implementation coming in Sprint 3
    return { id };
  }
}