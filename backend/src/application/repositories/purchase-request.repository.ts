import { BaseRepository } from './base.repository';

export class PurchaseRequestRepository extends BaseRepository<any> {
  async getByDepartment(departmentId: string) {
    // Implementation coming in Sprint 11
    return [];
  }
}