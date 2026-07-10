import { BaseRepository } from './base.repository';

export class WorkflowRepository extends BaseRepository<any> {
  async getByModule(moduleId: string) {
    // Implementation coming in Sprint 5
    return [];
  }

  async duplicate(id: string) {
    // Implementation coming in Sprint 5
    return { id: 'duplicated-id' };
  }
}
