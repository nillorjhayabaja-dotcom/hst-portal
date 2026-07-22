import { prisma } from '../../infrastructure/database/prisma.service';
import { auditService } from '../../infrastructure/audit/audit.service';

export interface TimelineEventData {
  gatePassId: string;
  eventType: 'created' | 'submitted' | 'approved' | 'rejected' | 'returned' | 'qr_generated' | 'released' | 'returned' | 'completed' | 'cancelled' | 'expired';
  actorId?: string;
  actorName?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export class GatePassTimelineService {
  /**
   * Create a timeline event for a gate pass
   */
  async createEvent(data: TimelineEventData) {
    try {
      const timelineEvent = await (prisma as any).gatePassTimeline.create({
        data: {
          gatePassId: data.gatePassId,
          eventType: data.eventType,
          actorId: data.actorId,
          actorName: data.actorName,
          description: data.description,
          metadata: data.metadata || {},
        },
      });

      // Also create audit log entry
      await auditService.record(data.eventType, 'gate_pass', {
        actorId: data.actorId,
        actorName: data.actorName,
        entityId: data.gatePassId,
        metadata: {
          eventType: data.eventType,
          description: data.description,
          ...data.metadata,
        },
      });

      return timelineEvent;
    } catch (error) {
      console.error('Failed to create timeline event:', error);
      // Don't throw - timeline should not break the main workflow
      return null;
    }
  }

  /**
   * Get all timeline events for a gate pass
   */
  async getTimeline(gatePassId: string) {
    try {
      const events = await (prisma as any).gatePassTimeline.findMany({
        where: { gatePassId },
        include: {
          actor: {
            select: {
              id: true,
              displayName: true,
              email: true,
            },
          },
        },
        orderBy: {
          eventTimestamp: 'asc',
        },
      });

      return events;
    } catch (error) {
      console.error('Failed to get timeline:', error);
      return [];
    }
  }

  /**
   * Get timeline events by type
   */
  async getTimelineByType(gatePassId: string, eventType: string) {
    try {
      const events = await (prisma as any).gatePassTimeline.findMany({
        where: {
          gatePassId,
          eventType,
        },
        include: {
          actor: {
            select: {
              id: true,
              displayName: true,
              email: true,
            },
          },
        },
        orderBy: {
          eventTimestamp: 'asc',
        },
      });

      return events;
    } catch (error) {
      console.error('Failed to get timeline by type:', error);
      return [];
    }
  }

  /**
   * Bulk create timeline events
   */
  async createBulkEvents(events: TimelineEventData[]) {
    try {
      const results = await (prisma as any).$transaction(
        events.map((event) =>
          (prisma as any).gatePassTimeline.create({
            data: {
              gatePassId: event.gatePassId,
              eventType: event.eventType,
              actorId: event.actorId,
              actorName: event.actorName,
              description: event.description,
              metadata: event.metadata || {},
            },
          })
        )
      );

      return results;
    } catch (error) {
      console.error('Failed to create bulk timeline events:', error);
      return [];
    }
  }

  /**
   * Delete timeline events for a gate pass (for cleanup)
   */
  async deleteTimeline(gatePassId: string) {
    try {
      await (prisma as any).gatePassTimeline.deleteMany({
        where: { gatePassId },
      });
      return true;
    } catch (error) {
      console.error('Failed to delete timeline:', error);
      return false;
    }
  }

  /**
   * Get timeline statistics
   */
  async getTimelineStats(gatePassId: string) {
    try {
      const stats = await (prisma as any).gatePassTimeline.groupBy({
        by: ['eventType'],
        where: { gatePassId },
        _count: {
          eventType: true,
        },
      });

      return stats.reduce((acc: Record<string, number>, stat: any) => {
        acc[stat.eventType] = stat._count.eventType;
        return acc;
      }, {} as Record<string, number>);
    } catch (error) {
      console.error('Failed to get timeline stats:', error);
      return {};
    }
  }
}

export const gatePassTimelineService = new GatePassTimelineService();