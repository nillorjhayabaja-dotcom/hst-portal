import type { Request } from 'express';

export interface AuthUser {
  id: string;
  employeeId: string;
  email: string;
  displayName: string;
  roles: string[];
  permissions: PermissionClaim[];
}

export interface PermissionClaim {
  moduleId: string;
  actions: string[];
  scope: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
      requestId?: string;
    }
  }
}

export type AuthedRequest = Request & { user: AuthUser };