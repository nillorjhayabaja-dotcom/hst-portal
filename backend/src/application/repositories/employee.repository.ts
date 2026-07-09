import { BaseRepository } from './base.repository';

export class EmployeeRepository extends BaseRepository<any> {
  async getTeam(employeeId: string) {
    // Implementation coming in Sprint 3
    return [];
  }

  async getSupervisor(employeeId: string) {
    // Implementation coming in Sprint 3
    return null;
  }
}