import { ForbiddenError } from '../../shared/errors';
import type { AuthUser } from '../../shared/types';
import { auditService } from '../../infrastructure/audit/audit.service';

export type Role = 'super_admin' | 'admin' | 'executive' | 'manager' | 'supervisor' | 'hr' | 'gad' | 'security' | 'employee';

export type Action = 'create' | 'view' | 'edit' | 'approve' | 'reject' | 'delete' | 'export' | 'manage';

export type Module =
  | 'dashboard'
  | 'gate-pass'
  | 'leave'
  | 'visitors'
  | 'vehicles'
  | 'item-pass'
  | 'food-request-slip'
  | 'purchase-request'
  | 'notifications'
  | 'profile'
  | 'reports'
  | 'approvals'
  | 'users'
  | 'departments'
  | 'positions'
  | 'audit-logs'
  | 'settings'
  | 'security-scanner';

/**
 * Enterprise Authorization Service
 * 
 * Central authorization logic for the entire HST Enterprise Portal.
 * All modules should use this service instead of duplicating authorization logic.
 */
export class AuthorizationService {
  /**
   * Check if user has permission for a specific module action
   */
  canAccess(user: AuthUser, module: Module, action: Action): boolean {
    // Super admin always has full access
    if (user.roles.includes('super_admin')) return true;

    const permissions = user.permissions || [];
    const wildcard = permissions.find(p => p.moduleId === 'all');
    if (wildcard && (wildcard.actions.includes('full') || wildcard.actions.includes(action))) {
      return true;
    }

    const claim = permissions.find(p => p.moduleId === module);
    if (!claim) return false;

    return claim.actions.includes('full') || claim.actions.includes(action);
  }

  /**
   * Check if user can manage a specific module
   */
  canManage(user: AuthUser, module: Module): boolean {
    return this.canAccess(user, module, 'manage');
  }

  /**
   * Check if user can view a specific module
   */
  canView(user: AuthUser, module: Module): boolean {
    return this.canAccess(user, module, 'view');
  }

  /**
   * Check if user can create records in a module
   */
  canCreate(user: AuthUser, module: Module): boolean {
    return this.canAccess(user, module, 'create');
  }

  /**
   * Check if user can edit records in a module
   */
  canEdit(user: AuthUser, module: Module): boolean {
    return this.canAccess(user, module, 'edit');
  }

  /**
   * Check if user can approve records in a module
   */
  canApprove(user: AuthUser, module: Module): boolean {
    return this.canAccess(user, module, 'approve');
  }

  /**
   * Check if user can delete records in a module
   */
  canDelete(user: AuthUser, module: Module): boolean {
    return this.canAccess(user, module, 'delete');
  }

  /**
   * Check if user can export data from a module
   */
  canExport(user: AuthUser, module: Module): boolean {
    return this.canAccess(user, module, 'export');
  }

  /**
   * Verify ownership of a record
   * Returns true if user owns the record or has admin/super_admin role
   */
  isOwnerOrAdmin(user: AuthUser, recordOwnerId: string): boolean {
    if (user.roles.includes('super_admin') || user.roles.includes('admin')) {
      return true;
    }
    return user.id === recordOwnerId;
  }

  /**
   * Get the data isolation scope for the user
   */
  getDataScope(user: AuthUser): {
    type: 'own' | 'department' | 'approval' | 'security' | 'all';
  } {
    if (user.roles.includes('super_admin') || user.roles.includes('admin')) {
      return { type: 'all' };
    }
    if (user.roles.includes('manager') || user.roles.includes('supervisor')) {
      return { type: 'department' };
    }
    if (user.roles.includes('security')) {
      return { type: 'security' };
    }
    if (user.roles.includes('hr') || user.roles.includes('executive')) {
      return { type: 'department' };
    }
    return { type: 'own' };
  }

  /**
   * Get ownership filter for Prisma queries
   * Returns undefined for admin/super_admin (no filter)
   * Returns requesterId filter for employees
   */
  getOwnershipFilter(user: AuthUser, requesterIdField: string = 'requesterId'): Record<string, any> | undefined {
    const scope = this.getDataScope(user);
    if (scope.type === 'all') return undefined;
    if (scope.type === 'own') return { [requesterIdField]: user.id };
    if (scope.type === 'security') return undefined; // Security uses status-based filtering
    return undefined; // Department/managers handled separately
  }

  /**
   * Check if user is associated with a specific request
   */
  async assertRecordAccess(
    user: AuthUser,
    module: Module,
    action: Action,
    record: { requesterId?: string; departmentId?: string; status?: string },
    recordId: string
  ): Promise<void> {
    const hasPermission = this.canAccess(user, module, action);
    if (!hasPermission) {
      await this.logDeniedAccess(user, module, action, recordId, 'Missing permission');
      throw new ForbiddenError(`Missing permission: ${action} on ${module}`);
    }

    const scope = this.getDataScope(user);
    
    // Super admin and admin can access all records
    if (scope.type === 'all') return;

    // Security can access approved/released/completed records
    if (scope.type === 'security') {
      if (record.status && ['approved', 'completed', 'released'].includes(record.status)) {
        return;
      }
    }

    // Check ownership for employees
    if (scope.type === 'own') {
      if (record.requesterId === user.id) return;
      await this.logDeniedAccess(user, module, action, recordId, 'Not the owner of this record');
      throw new ForbiddenError('You do not have permission to access this record');
    }

    // Managers/supervisors: check department or approval chain
    if (scope.type === 'department') {
      if (record.requesterId === user.id) return;
      await this.logDeniedAccess(user, module, action, recordId, 'Outside department scope');
      throw new ForbiddenError('You do not have permission to access this record outside your department');
    }

    await this.logDeniedAccess(user, module, action, recordId, 'Access denied by data scope rules');
    throw new ForbiddenError('You do not have permission to access this record');
  }

  /**
   * Log denied access attempts
   */
  private async logDeniedAccess(
    user: AuthUser,
    module: Module,
    action: Action,
    entityId: string,
    reason: string
  ): Promise<void> {
    await auditService.record('access_denied', module, {
      actorId: user.id,
      entityId,
      metadata: {
        reason,
        userRoles: user.roles,
        module,
        action
      }
    }).catch(() => {
      // Silently fail audit logging
    });
  }
}

// Singleton instance for the application
export const authorizationService = new AuthorizationService();