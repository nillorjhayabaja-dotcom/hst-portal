import { BaseRepository } from './base.repository';

export class VisitorRepository extends BaseRepository<any> {
  async getByHost(hostId: string) {
    // Implementation coming in Sprint 12
    return [];
  }
}
