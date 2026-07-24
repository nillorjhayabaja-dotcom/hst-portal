import { prisma } from '../../infrastructure/database/prisma.service';
import { bcryptService } from '../../infrastructure/auth/bcrypt.service';
import { auditService } from '../../infrastructure/audit/audit.service';
import { NotFoundError, ValidationError, ForbiddenError } from '../../shared/errors';
import type { AuthUser } from '../../shared/types';

const DEFAULT_PASSWORD = 'Admin@12345';
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;
const PASSWORD_EXPIRY_DAYS = 90;

interface CreateUserInput {
  employeeId: string;
  email: string;
  displayName: string;
  password?: string;
  roleIds: string[];
  departmentId?: string;
  positionId?: string;
}

interface UpdateUserInput {
  email?: string;
  displayName?: string;
  isActive?: boolean;
  roleIds?: string[];
}

interface UserManagementFilters {
  search?: string;
  role?: string;
  department?: string;
  status?: string;
  online?: boolean;
  locked?: boolean;
  temporaryPassword?: boolean;
  neverLoggedIn?: boolean;
  dateCreatedFrom?: string;
  dateCreatedTo?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const userManagementService = {
  async getDashboardSummary() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      onlineUsers,
      lockedAccounts,
      tempPasswordUsers,
      passwordExpiringSoon,
      failedAttemptsToday,
      newUsersThisMonth,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { isActive: true, deletedAt: null } }),
      prisma.user.count({ where: { isActive: false, deletedAt: null } }),
      prisma.user.count({ where: { isOnline: true, deletedAt: null } }),
      prisma.user.count({ where: { isLocked: true, deletedAt: null } }),
      prisma.user.count({ where: { defaultPasswordUsed: true, deletedAt: null } }),
      prisma.user.count({
        where: {
          passwordExpiresAt: { lte: thirtyDaysFromNow, gte: now },
          deletedAt: null,
        },
      }),
      prisma.failedLoginAttempt.count({
        where: { attemptedAt: { gte: todayStart } },
      }),
      prisma.user.count({
        where: { createdAt: { gte: monthStart }, deletedAt: null },
      }),
    ]);

    const offlineUsers = totalUsers - onlineUsers;

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      onlineUsers,
      offlineUsers,
      lockedAccounts,
      temporaryPasswordUsers: tempPasswordUsers,
      passwordExpiringSoon,
      failedLoginAttemptsToday: failedAttemptsToday,
      newUsersThisMonth,
    };
  },

  async getUsers(filters: UserManagementFilters) {
    const {
      search,
      role,
      status,
      locked,
      temporaryPassword,
      neverLoggedIn,
      dateCreatedFrom,
      dateCreatedTo,
      page = 1,
      pageSize = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { employeeId: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;
    if (status === 'locked') where.isLocked = true;
    if (status === 'suspended') where.suspendedAt = { not: null };
    if (locked === true) where.isLocked = true;
    if (temporaryPassword === true) where.defaultPasswordUsed = true;
    if (neverLoggedIn === true) where.lastLoginAt = null;

    if (dateCreatedFrom || dateCreatedTo) {
      where.createdAt = {};
      if (dateCreatedFrom) where.createdAt.gte = new Date(dateCreatedFrom);
      if (dateCreatedTo) where.createdAt.lte = new Date(dateCreatedTo);
    }

    if (role) {
      where.userRoles = {
        some: { roleId: role },
      };
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
          employees: {
            include: {
              department: true,
              position: true,
            },
          },
          _count: {
            select: {
              sessions: { where: { isActive: true } },
              loginHistory: true,
              failedLoginAttempts: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const mapped = users.map((user) => {
      const role = user.userRoles[0]?.role;
      const employee = user.employees;
      const activeSessions = user._count.sessions;

      return {
        id: user.id,
        employeeId: user.employeeId,
        displayName: user.displayName,
        email: user.email,
        department: employee?.department?.name ?? null,
        departmentId: employee?.departmentId ?? null,
        position: employee?.position?.title ?? employee?.title ?? null,
        role: role
          ? { id: role.id, name: role.name, shortName: role.shortName }
          : null,
        isActive: user.isActive,
        isOnline: user.isOnline,
        onlineStatus: user.onlineStatus,
        isLocked: user.isLocked,
        lockedUntil: user.lockedUntil,
        lastLoginAt: user.lastLoginAt,
        lastActivityAt: user.lastActivityAt,
        passwordStatus: this.getPasswordStatus(user),
        defaultPasswordUsed: user.defaultPasswordUsed,
        mustChangePassword: user.mustChangePassword,
        passwordResetRequired: user.passwordResetRequired,
        loginAttempts: user.loginAttempts,
        activeSessions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        createdBy: user.createdBy,
        updatedBy: user.updatedBy,
      };
    });

    return {
      data: mapped,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  },

  getPasswordStatus(user: any): string {
    if (user.defaultPasswordUsed) return 'Temporary Password';
    if (user.mustChangePassword || user.passwordResetRequired) return 'Reset Required';
    if (!user.lastLoginAt) return 'Never Logged In';
    return 'Active';
  },

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: {
              include: { permissions: true },
            },
          },
        },
        employees: {
          include: {
            department: true,
            position: true,
            supervisor: true,
          },
        },
        _count: {
          select: {
            sessions: { where: { isActive: true } },
            loginHistory: true,
            passwordHistory: true,
            devices: true,
            failedLoginAttempts: true,
          },
        },
      },
    });

    if (!user || user.deletedAt) throw new NotFoundError('User not found');

    const role = user.userRoles[0]?.role;
    const employee = user.employees;

    return {
      id: user.id,
      employeeId: user.employeeId,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      isOnline: user.isOnline,
      onlineStatus: user.onlineStatus,
      isLocked: user.isLocked,
      lockedUntil: user.lockedUntil,
      lockedBy: user.lockedBy,
      lockReason: user.lockReason,
      loginAttempts: user.loginAttempts,
      lastLoginAt: user.lastLoginAt,
      lastActivityAt: user.lastActivityAt,
      passwordChangedAt: user.passwordChangedAt,
      passwordExpiresAt: user.passwordExpiresAt,
      mustChangePassword: user.mustChangePassword,
      passwordResetRequired: user.passwordResetRequired,
      defaultPasswordUsed: user.defaultPasswordUsed,
      suspendedAt: user.suspendedAt,
      suspendedBy: user.suspendedBy,
      suspendedReason: user.suspendedReason,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      createdBy: user.createdBy,
      updatedBy: user.updatedBy,
      employee: employee
        ? {
            id: employee.id,
            employeeNumber: employee.employeeNumber,
            firstName: employee.firstName,
            lastName: employee.lastName,
            title: employee.title,
            department: employee.department?.name ?? null,
            departmentId: employee.departmentId,
            position: employee.position?.title ?? null,
            positionId: employee.positionId,
            supervisor: employee.supervisor
              ? {
                  id: employee.supervisor.id,
                  firstName: employee.supervisor.firstName,
                  lastName: employee.supervisor.lastName,
                }
              : null,
          }
        : null,
      role: role
        ? {
            id: role.id,
            name: role.name,
            shortName: role.shortName,
            permissions: role.permissions.map((p) => ({
              id: p.id,
              moduleId: p.moduleId,
              actions: p.actions,
              scope: p.scope,
            })),
          }
        : null,
      stats: {
        activeSessions: user._count.sessions,
        totalLogins: user._count.loginHistory,
        totalDevices: user._count.devices,
        failedAttempts: user._count.failedLoginAttempts,
      },
    };
  },

  async createUser(input: CreateUserInput, actor: AuthUser) {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { employeeId: input.employeeId },
          { email: input.email },
        ],
        deletedAt: null,
      },
    });

    if (existing) {
      if (existing.employeeId === input.employeeId) {
        throw new ValidationError('Employee ID already has an account');
      }
      throw new ValidationError('Email already in use');
    }

    const password = input.password || DEFAULT_PASSWORD;
    const passwordHash = await bcryptService.hash(password);

    const user = await prisma.user.create({
      data: {
        employeeId: input.employeeId,
        email: input.email,
        displayName: input.displayName,
        passwordHash,
        defaultPasswordUsed: !input.password,
        mustChangePassword: !input.password,
        passwordResetRequired: !input.password,
        passwordExpiresAt: new Date(Date.now() + PASSWORD_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
        createdBy: actor.displayName,
        updatedBy: actor.displayName,
      },
    });

    // Assign roles
    if (input.roleIds.length > 0) {
      await prisma.userRole.createMany({
        data: input.roleIds.map((roleId) => ({
          userId: user.id,
          roleId,
          assignedBy: actor.id,
        })),
      });
    }

    // Link to employee if exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { employeeNumber: input.employeeId },
    });
    if (existingEmployee) {
      await prisma.employee.update({
        where: { id: existingEmployee.id },
        data: { userId: user.id },
      });
    }

    // Create employee record if departmentId or positionId provided and no existing employee
    if (!existingEmployee && (input.departmentId || input.positionId)) {
      const nameParts = input.displayName.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || firstName;

      await prisma.employee.create({
        data: {
          employeeNumber: input.employeeId,
          userId: user.id,
          firstName,
          lastName,
          email: input.email,
          departmentId: input.departmentId || null,
          positionId: input.positionId || null,
          hireDate: new Date(),
        },
      });
    }

    await auditService.record('user_created', 'user', {
      actorId: actor.id,
      actorName: actor.displayName,
      entityId: user.id,
      targetId: user.id,
      changes: { email: input.email, employeeId: input.employeeId, departmentId: input.departmentId, positionId: input.positionId, roleIds: input.roleIds },
      ipAddress: (actor as any).ipAddress,
      userAgent: (actor as any).userAgent,
    });

    return user;
  },

  async updateUser(id: string, input: UpdateUserInput, actor: AuthUser) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.deletedAt) throw new NotFoundError('User not found');

    const updateData: any = {};

    if (input.email !== undefined) {
      const emailExists = await prisma.user.findFirst({
        where: { email: input.email, id: { not: id }, deletedAt: null },
      });
      if (emailExists) throw new ValidationError('Email already in use');
      updateData.email = input.email;
    }

    if (input.displayName !== undefined) updateData.displayName = input.displayName;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;
    updateData.updatedBy = actor.displayName;

    await prisma.user.update({ where: { id }, data: updateData });

    if (input.roleIds !== undefined) {
      await prisma.userRole.deleteMany({ where: { userId: id } });
      await prisma.userRole.createMany({
        data: input.roleIds.map((roleId) => ({
          userId: id,
          roleId,
          assignedBy: actor.id,
        })),
      });
    }

    await auditService.record('user_updated', 'user', {
      actorId: actor.id,
      actorName: actor.displayName,
      entityId: id,
      targetId: id,
      changes: input,
      ipAddress: (actor as any).ipAddress,
      userAgent: (actor as any).userAgent,
    });

    return this.getUserById(id);
  },

  async resetPassword(id: string, actor: AuthUser, ctx: { ip?: string; userAgent?: string }) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.deletedAt) throw new NotFoundError('User not found');

    const passwordHash = await bcryptService.hash(DEFAULT_PASSWORD);

    await prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        passwordChangedAt: new Date(),
        passwordExpiresAt: new Date(Date.now() + PASSWORD_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
        mustChangePassword: true,
        passwordResetRequired: true,
        defaultPasswordUsed: true,
        loginAttempts: 0,
        isLocked: false,
        lockedUntil: null,
        updatedBy: actor.displayName,
      },
    });

    // Invalidate all sessions
    await prisma.userSession.updateMany({
      where: { userId: id, isActive: true },
      data: { isActive: false },
    });

    // Log the password reset
    await prisma.passwordResetLog.create({
      data: {
        userId: id,
        resetBy: actor.id,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
        reason: 'Admin initiated password reset',
        notified: true,
      },
    });

    // Record audit
    await auditService.record('password_reset', 'user', {
      actorId: actor.id,
      actorName: actor.displayName,
      entityId: id,
      targetId: id,
      changes: { passwordReset: true, reason: 'Admin reset' },
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return { success: true, message: 'Password has been reset to default. User must change on next login.' };
  },

  async toggleActive(id: string, actor: AuthUser, ctx: { ip?: string; userAgent?: string }) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.deletedAt) throw new NotFoundError('User not found');

    const newActive = !user.isActive;

    await prisma.user.update({
      where: { id },
      data: {
        isActive: newActive,
        updatedBy: actor.displayName,
        ...(newActive ? {} : { isOnline: false }),
      },
    });

    // Invalidate sessions if deactivating
    if (!newActive) {
      await prisma.userSession.updateMany({
        where: { userId: id, isActive: true },
        data: { isActive: false },
      });
    }

    const action = newActive ? 'user_activated' : 'user_deactivated';
    await auditService.record(action, 'user', {
      actorId: actor.id,
      actorName: actor.displayName,
      entityId: id,
      targetId: id,
      changes: { isActive: newActive },
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return { success: true, message: newActive ? 'Account activated successfully' : 'Account deactivated successfully' };
  },

  async toggleLock(id: string, actor: AuthUser, ctx: { ip?: string; userAgent?: string }) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.deletedAt) throw new NotFoundError('User not found');

    const newLocked = !user.isLocked;

    await prisma.user.update({
      where: { id },
      data: {
        isLocked: newLocked,
        lockedUntil: newLocked ? new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000) : null,
        lockedBy: newLocked ? actor.id : null,
        lockReason: newLocked ? 'Admin locked account' : null,
        unlockAt: newLocked ? null : new Date(),
        unlockReason: newLocked ? null : 'Admin unlocked account',
        updatedBy: actor.displayName,
        ...(newLocked ? { isOnline: false } : {}),
      },
    });

    if (newLocked) {
      await prisma.userSession.updateMany({
        where: { userId: id, isActive: true },
        data: { isActive: false },
      });
    }

    const action = newLocked ? 'user_locked' : 'user_unlocked';
    await auditService.record(action, 'user', {
      actorId: actor.id,
      actorName: actor.displayName,
      entityId: id,
      targetId: id,
      changes: { isLocked: newLocked },
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return { success: true, message: newLocked ? 'Account locked successfully' : 'Account unlocked successfully' };
  },

  async suspendUser(id: string, reason: string, actor: AuthUser, ctx: { ip?: string; userAgent?: string }) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.deletedAt) throw new NotFoundError('User not found');

    await prisma.user.update({
      where: { id },
      data: {
        suspendedAt: new Date(),
        suspendedBy: actor.id,
        suspendedReason: reason,
        isActive: false,
        isOnline: false,
        updatedBy: actor.displayName,
      },
    });

    await prisma.userSession.updateMany({
      where: { userId: id, isActive: true },
      data: { isActive: false },
    });

    await auditService.record('user_suspended', 'user', {
      actorId: actor.id,
      actorName: actor.displayName,
      entityId: id,
      targetId: id,
      changes: { suspended: true, reason },
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return { success: true, message: 'Account suspended successfully' };
  },

  async unsuspendUser(id: string, actor: AuthUser, ctx: { ip?: string; userAgent?: string }) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.deletedAt) throw new NotFoundError('User not found');

    await prisma.user.update({
      where: { id },
      data: {
        suspendedAt: null,
        suspendedBy: null,
        suspendedReason: null,
        isActive: true,
        updatedBy: actor.displayName,
      },
    });

    await auditService.record('user_unsuspended', 'user', {
      actorId: actor.id,
      actorName: actor.displayName,
      entityId: id,
      targetId: id,
      changes: { suspended: false },
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return { success: true, message: 'Account unsuspended successfully' };
  },

  async forceLogout(id: string, actor: AuthUser, ctx: { ip?: string; userAgent?: string }) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.deletedAt) throw new NotFoundError('User not found');

    await prisma.userSession.updateMany({
      where: { userId: id, isActive: true },
      data: { isActive: false },
    });

    await prisma.user.update({
      where: { id },
      data: { isOnline: false, onlineStatus: 'offline', updatedBy: actor.displayName },
    });

    await auditService.record('force_logout', 'user', {
      actorId: actor.id,
      actorName: actor.displayName,
      entityId: id,
      targetId: id,
      changes: { forceLogout: true },
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return { success: true, message: 'User has been force logged out' };
  },

  async changeUserRole(id: string, roleIds: string[], actor: AuthUser, ctx: { ip?: string; userAgent?: string }) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.deletedAt) throw new NotFoundError('User not found');

    const oldRoles = await prisma.userRole.findMany({
      where: { userId: id },
      include: { role: true },
    });

    await prisma.userRole.deleteMany({ where: { userId: id } });
    await prisma.userRole.createMany({
      data: roleIds.map((roleId) => ({
        userId: id,
        roleId,
        assignedBy: actor.id,
      })),
    });

    await auditService.record('role_changed', 'user', {
      actorId: actor.id,
      actorName: actor.displayName,
      entityId: id,
      targetId: id,
      changes: {
        oldRoles: oldRoles.map((r) => r.role.name),
        newRoleIds: roleIds,
      },
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return { success: true, message: 'Role updated successfully' };
  },

  async getUserSessions(userId: string) {
    return prisma.userSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  },

  async getUserLoginHistory(userId: string, page = 1, pageSize = 20) {
    const [total, data] = await Promise.all([
      prisma.loginHistory.count({ where: { userId } }),
      prisma.loginHistory.findMany({
        where: { userId },
        orderBy: { loginTime: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      data,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  },

  async getUserDevices(userId: string) {
    return prisma.userDevice.findMany({
      where: { userId },
      orderBy: { lastUsed: 'desc' },
    });
  },

  async getUserAuditLogs(userId: string, page = 1, pageSize = 20) {
    const [total, data] = await Promise.all([
      prisma.auditLog.count({
        where: { OR: [{ entityId: userId }, { targetId: userId }, { actorId: userId }] },
      }),
      prisma.auditLog.findMany({
        where: { OR: [{ entityId: userId }, { targetId: userId }, { actorId: userId }] },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      data,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  },

  async softDeleteUser(id: string, actor: AuthUser, ctx: { ip?: string; userAgent?: string }) {
    if (id === actor.id) throw new ValidationError('You cannot delete yourself');

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.deletedAt) throw new NotFoundError('User not found');

    await prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: actor.id,
        isActive: false,
        isOnline: false,
        updatedBy: actor.displayName,
      },
    });

    await prisma.userSession.updateMany({
      where: { userId: id, isActive: true },
      data: { isActive: false },
    });

    await auditService.record('user_deleted', 'user', {
      actorId: actor.id,
      actorName: actor.displayName,
      entityId: id,
      targetId: id,
      changes: { deleted: true },
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return { success: true, message: 'User deleted successfully' };
  },

  async changePassword(id: string, currentPassword: string, newPassword: string, actor?: AuthUser, ctx?: { ip?: string; userAgent?: string }) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.deletedAt) throw new NotFoundError('User not found');

    // Verify current password
    const isValid = await bcryptService.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new ValidationError('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcryptService.hash(newPassword);

    // Update password
    await prisma.user.update({
      where: { id },
      data: {
        passwordHash: newPasswordHash,
        passwordChangedAt: new Date(),
        passwordExpiresAt: new Date(Date.now() + PASSWORD_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
        mustChangePassword: false,
        passwordResetRequired: false,
        defaultPasswordUsed: false,
        updatedBy: actor?.displayName || user.displayName,
      },
    });

    // Invalidate all sessions
    await prisma.userSession.updateMany({
      where: { userId: id, isActive: true },
      data: { isActive: false },
    });

    // Record audit if actor is provided (admin reset)
    if (actor) {
      await auditService.record('password_changed', 'user', {
        actorId: actor.id,
        actorName: actor.displayName,
        entityId: id,
        targetId: id,
        changes: { passwordChanged: true, reason: 'User changed password after reset' },
        ipAddress: ctx?.ip,
        userAgent: ctx?.userAgent,
      });
    }

    return { success: true, message: 'Password changed successfully' };
  },
};
