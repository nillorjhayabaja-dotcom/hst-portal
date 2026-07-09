import { BaseRepository } from './base.repository';

export class RoleRepository extends BaseRepository<any> {
  async getPermissions(roleId: string) {
    // Implementation coming in Sprint 3
    return [];
  }

  async setPermissions(roleId: string, permissions: string[]) {
    // Implementation coming in Sprint 3
    return true;
  }
}