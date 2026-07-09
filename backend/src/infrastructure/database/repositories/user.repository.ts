import { prisma } from '../prisma.service';
import type { PermissionClaim } from '../../../shared/types';

export interface UserWithAuth {
  id: string;
  employeeId: string;
  email: string;
  displayName: string;
  passwordHash: string;
  isActive: boolean;
  isLocked: boolean;
  lockedUntil: Date | null;
  loginAttempts: number;
  mustChangePassword: boolean;
  roles: string[];
  permissions: PermissionClaim[];
}

export const userRepository = {
  async findByLogin(identifier: string): Promise<UserWithAuth | null> {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ employeeId: identifier }, { email: identifier }],
      },
      include: {
        userRoles: { include: { role: { include: { permissions: true } } } },
      },
    });
    if (!user) return null;
    return mapUserWithAuth(user);
  },

  async findById(id: string): Promise<UserWithAuth | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: { include: { role: { include: { permissions: true } } } },
      },
    });
    if (!user) return null;
    return mapUserWithAuth(user);
  },

  async updateLoginState(
    id: string,
    state: { loginAttempts: number; isLocked?: boolean; lockedUntil?: Date | null; lastLoginAt?: Date },
  ): Promise<void> {
    await prisma.user.update({ where: { id }, data: state });
  },

  async setPassword(id: string, passwordHash: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { passwordHash, passwordChangedAt: new Date(), mustChangePassword: false, loginAttempts: 0 },
    });
  },
};

function mapUserWithAuth(user: any): UserWithAuth {
  const roles: string[] = [];
  const permissions: PermissionClaim[] = [];
  for (const ur of user.userRoles) {
    roles.push(ur.role.id);
    for (const perm of ur.role.permissions) {
      permissions.push({
        moduleId: perm.moduleId,
        actions: perm.actions,
        scope: perm.scope,
      });
    }
  }
  return {
    id: user.id,
    employeeId: user.employeeId,
    email: user.email,
    displayName: user.displayName,
    passwordHash: user.passwordHash,
    isActive: user.isActive,
    isLocked: user.isLocked,
    lockedUntil: user.lockedUntil,
    loginAttempts: user.loginAttempts,
    mustChangePassword: user.mustChangePassword,
    roles,
    permissions,
  };
}