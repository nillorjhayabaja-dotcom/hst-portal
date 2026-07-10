import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { ForbiddenError, UnauthorizedError } from '../../shared/errors';
import type { PermissionClaim } from '../../shared/types';

/**
 * Require a specific permission for a module. Scope is checked at the
 * controller/service level where entity ownership is known; this guards the
 * action + module pair.
 */
export function requirePermission(moduleId: string, action: string): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new UnauthorizedError());
    const allowed = hasPermission(req.user.permissions, moduleId, action);
    if (!allowed) {
      return next(new ForbiddenError(`Missing permission: ${action} on ${moduleId}`));
    }
    next();
  };
}

export function hasPermission(
  permissions: PermissionClaim[],
  moduleId: string,
  action: string,
): boolean {
  // Super-admin style wildcard on the special "all" module.
  const wildcard = permissions.find((p) => p.moduleId === 'all');
  if (wildcard && (wildcard.actions.includes('full') || wildcard.actions.includes(action))) {
    return true;
  }
  const claim = permissions.find((p) => p.moduleId === moduleId);
  if (!claim) return false;
  return claim.actions.includes('full') || claim.actions.includes(action);
}

export function requireRole(...roles: string[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new UnauthorizedError());
    const ok = roles.some((r) => req.user!.roles.includes(r));
    if (!ok) return next(new ForbiddenError(`Requires one of roles: ${roles.join(', ')}`));
    next();
  };
}
