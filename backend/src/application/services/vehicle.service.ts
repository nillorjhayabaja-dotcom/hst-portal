import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class VehicleService {
  async getAll() {
    // Implementation coming in Sprint 13
    return [];
  }

  async getById(id: string) {
    // Implementation coming in Sprint 13
    return { id };
  }

  async create(data: any) {
    // Implementation coming in Sprint 13
    return { id: 'new-id' };
  }

  async update(id: string, data: any) {
    // Implementation coming in Sprint 13
    return { id };
  }

  async delete(id: string) {
    // Implementation coming in Sprint 13
    return { id };
  }
}
