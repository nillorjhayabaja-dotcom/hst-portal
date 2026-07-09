import { BaseRepository } from './base.repository';

export class LeaveRepository extends BaseRepository<any> {
  async getByEmployeeId(employeeId: string) {
    // Implementation coming in Sprint 9
    return [];
  }
}