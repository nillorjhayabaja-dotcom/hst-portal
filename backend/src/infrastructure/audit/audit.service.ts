import { auditRepository } from '../database/repositories/audit.repository';
import type { Request } from 'express';

export interface AuditContext {
  actorId?: string;
  actorName?: string;
  ipAddress?: string;
  userAgent?: string;
}

export const auditService = {
  async record(
    action: string,
    entityType: string,
    ctx: AuditContext & {
      entityId?: string;
      targetId?: string;
      changes?: unknown;
      metadata?: unknown;
    },
  ) {
    return auditRepository.log({
      actorId: ctx.actorId,
      actorName: ctx.actorName,
      action,
      entityType,
      entityId: ctx.entityId,
      targetId: ctx.targetId,
      changes: ctx.changes,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: ctx.metadata,
    });
  },

  fromRequest(
    req: Request,
    action: string,
    entityType: string,
    extra: Record<string, unknown> = {},
  ) {
    return this.record(action, entityType, {
      actorId: req.user?.id,
      actorName: req.user?.displayName,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      ...extra,
    });
  },

  list(params: { skip?: number; take?: number; entityType?: string; actorId?: string } = {}) {
    return auditRepository.list(params);
  },
};
