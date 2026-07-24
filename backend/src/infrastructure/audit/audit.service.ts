import { auditRepository } from '../database/repositories/audit.repository';
import type { Request } from 'express';

export interface AuditContext {
  actorId?: string;
  actorName?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  correlationId?: string;
  departmentId?: string;
  userRole?: string;
}

export interface AuditRecord {
  action: string;
  entityType: string;
  entityId?: string;
  targetId?: string;
  changes?: unknown;
  metadata?: unknown;
  success?: boolean;
  failureReason?: string;
}

/**
 * Enterprise Audit Service
 * 
 * Provides comprehensive audit logging for all system operations.
 * Every critical action is logged with full context including:
 * - User identity and role
 * - IP address and user agent
 * - Session and correlation IDs
 * - Before/after values for changes
 * - Success/failure status
 */
export const auditService = {
  async record(
    action: string,
    entityType: string,
    ctx: AuditContext & {
      entityId?: string;
      targetId?: string;
      changes?: unknown;
      metadata?: unknown;
      success?: boolean;
      failureReason?: string;
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
      metadata: {
        ...(ctx.metadata as Record<string, unknown> || {}),
        sessionId: ctx.sessionId,
        correlationId: ctx.correlationId,
        departmentId: ctx.departmentId,
        userRole: ctx.userRole,
        success: ctx.success,
        failureReason: ctx.failureReason,
      },
    });
  },

  /**
   * Create audit log from Express request object
   * Automatically extracts user context, IP, and user agent
   */
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

  /**
   * Log a successful operation
   */
  async logSuccess(
    action: string,
    entityType: string,
    ctx: AuditContext & {
      entityId?: string;
      targetId?: string;
      changes?: unknown;
      metadata?: unknown;
    },
  ) {
    return this.record(action, entityType, {
      ...ctx,
      success: true,
    });
  },

  /**
   * Log a failed operation
   */
  async logFailure(
    action: string,
    entityType: string,
    failureReason: string,
    ctx: AuditContext & {
      entityId?: string;
      targetId?: string;
      metadata?: unknown;
    },
  ) {
    return this.record(action, entityType, {
      ...ctx,
      success: false,
      failureReason,
    });
  },

  /**
   * Log data export operations
   */
  async logExport(
    req: Request,
    module: string,
    exportType: string,
    recordCount: number,
    filters?: Record<string, unknown>,
  ) {
    return this.fromRequest(req, 'export', module, {
      entityId: req.user?.id,
      metadata: {
        exportType,
        recordCount,
        filters,
        timestamp: new Date().toISOString(),
      },
    });
  },

  /**
   * Log authentication events
   */
  async logAuth(
    action: 'login' | 'logout' | 'login_failed' | 'password_reset' | 'password_changed',
    userId: string,
    ctx: {
      ipAddress?: string;
      userAgent?: string;
      failureReason?: string;
      metadata?: unknown;
    },
  ) {
    return this.record(action, 'auth', {
      actorId: userId,
      entityId: userId,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      success: action !== 'login_failed',
      failureReason: ctx.failureReason,
      metadata: ctx.metadata,
    });
  },

  /**
   * Log security events
   */
  async logSecurity(
    action: string,
    userId: string,
    ctx: {
      entityId?: string;
      ipAddress?: string;
      userAgent?: string;
      metadata?: unknown;
    },
  ) {
    return this.record(action, 'security', {
      actorId: userId,
      entityId: ctx.entityId,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: ctx.metadata,
    });
  },

  /**
   * Log workflow state transitions
   */
  async logWorkflow(
    action: string,
    requestId: string,
    fromStatus: string,
    toStatus: string,
    actorId: string,
    metadata?: unknown,
  ) {
    return this.record(action, 'workflow', {
      actorId,
      entityId: requestId,
      changes: { from: fromStatus, to: toStatus },
      metadata: {
        requestId,
        fromStatus,
        toStatus,
        ...(metadata as Record<string, unknown> || {}),
      },
    });
  },

  list(params: { skip?: number; take?: number; entityType?: string; actorId?: string } = {}) {
    return auditRepository.list(params);
  },
};