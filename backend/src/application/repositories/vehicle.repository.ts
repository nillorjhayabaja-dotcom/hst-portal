import { BaseRepository } from './base.repository';

export class VehicleRepository extends BaseRepository<any> {
  async getAvailable() {
    // Implementation coming in Sprint 13
    return [];
  }

  async getByDriver(driverId: string) {
    // Implementation coming in Sprint 13
    return [];
  }
}