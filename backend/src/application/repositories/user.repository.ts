import { BaseRepository } from './base.repository';

export class UserRepository extends BaseRepository<any> {
  async findByEmployeeNumber(employeeNumber: string) {
    // Implementation coming in Sprint 3
    return null;
  }

  async findByEmail(email: string) {
    // Implementation coming in Sprint 3
    return null;
  }
}
