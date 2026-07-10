import { userRepository } from '../../infrastructure/database/repositories/user.repository';
import { bcryptService } from '../../infrastructure/auth/bcrypt.service';
import { jwtService } from '../../infrastructure/auth/jwt.service';
import { UnauthorizedError, ValidationError } from '../../shared/errors';
import { auditService } from '../../infrastructure/audit/audit.service';
import { emailService } from '../../infrastructure/notifications/email.service';
import { env } from '../../infrastructure/config/env';
import { randomToken } from '../../shared/utils';
import { prisma } from '../../infrastructure/database/prisma.service';

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    employeeId: string;
    email: string;
    displayName: string;
    roles: string[];
    permissions: { moduleId: string; actions: string[]; scope: string }[];
    mustChangePassword: boolean;
  };
}

export const authService = {
  async login(
    identifier: string,
    password: string,
    ctx: { ip?: string; userAgent?: string },
  ): Promise<AuthResult> {
    const user = await userRepository.findByLogin(identifier);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid credentials');
    }
    if (user.isLocked && user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedError('Account is temporarily locked');
    }
    const ok = await bcryptService.compare(password, user.passwordHash);
    if (!ok) {
      const attempts = user.loginAttempts + 1;
      const locked = attempts >= MAX_ATTEMPTS;
      await userRepository.updateLoginState(user.id, {
        loginAttempts: attempts,
        isLocked: locked,
        lockedUntil: locked ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
      });
      throw new UnauthorizedError('Invalid credentials');
    }
    await userRepository.updateLoginState(user.id, {
      loginAttempts: 0,
      isLocked: false,
      lockedUntil: null,
      lastLoginAt: new Date(),
    });
    await auditService.record('login', 'auth', {
      actorId: user.id,
      actorName: user.displayName,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return this.issueTokens(user);
  },

  async refresh(refreshToken: string): Promise<AuthResult> {
    const payload = jwtService.verifyRefresh(refreshToken);
    const user = await userRepository.findById(payload.sub);
    if (!user || !user.isActive) throw new UnauthorizedError('Invalid refresh token');
    return this.issueTokens(user);
  },

  async logout(_userId: string): Promise<void> {
    // Stateless JWT: client discards tokens. Audit the event.
    await auditService.record('logout', 'auth', { actorId: _userId });
  },

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) throw new UnauthorizedError();
    const ok = await bcryptService.compare(currentPassword, user.passwordHash);
    if (!ok) throw new ValidationError('Current password is incorrect');
    if (currentPassword === newPassword)
      throw new ValidationError('New password must differ from current');
    const hash = await bcryptService.hash(newPassword);
    await userRepository.setPassword(user.id, hash);
    await auditService.record('update', 'user', { actorId: userId, entityId: user.id });
  },

  async forgotPassword(identifier: string): Promise<void> {
    const user = await userRepository.findByLogin(identifier);
    if (!user) return; // do not reveal existence
    const token = randomToken(24);
    const expiry = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.user.update({
      where: { id: user.id },
      data: { metadata: { resetToken: token, resetExpiry: expiry.toISOString() } } as any,
    });
    const link = `${env.app.frontendUrl}/reset-password?token=${token}`;
    await emailService.send(
      user.email,
      'Password Reset',
      `<p>Reset your password: <a href="${link}">${link}</a></p>`,
    );
  },

  issueTokens(user: {
    id: string;
    employeeId: string;
    email: string;
    displayName: string;
    roles: string[];
    permissions: { moduleId: string; actions: string[]; scope: string }[];
    mustChangePassword: boolean;
  }): AuthResult {
    const accessToken = jwtService.signAccess({
      sub: user.id,
      employeeId: user.employeeId,
      email: user.email,
      displayName: user.displayName,
      roles: user.roles,
    });
    const refreshToken = jwtService.signRefresh({ sub: user.id, jti: randomToken(8) });
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        employeeId: user.employeeId,
        email: user.email,
        displayName: user.displayName,
        roles: user.roles,
        permissions: user.permissions,
        mustChangePassword: user.mustChangePassword,
      },
    };
  },
};
