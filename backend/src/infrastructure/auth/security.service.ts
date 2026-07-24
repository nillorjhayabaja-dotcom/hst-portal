import type { Request } from 'express';
import { prisma } from '../database/prisma.service';

/**
 * Enterprise Security Service
 * 
 * Provides centralized security functions for:
 * - Brute force detection
 * - Session validation
 * - Device tracking
 * - Concurrent session detection
 */
export class SecurityService {
  private static readonly MAX_LOGIN_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION_MINUTES = 30;
  private static readonly MAX_CONCURRENT_SESSIONS = 5;

  /**
   * Validate login attempts for brute force protection
   */
  async validateLoginAttempt(identifier: string, ipAddress: string): Promise<{
    allowed: boolean;
    remainingAttempts: number;
    lockoutMinutes?: number;
  }> {
    // Count recent failed attempts
    const recentAttempts = await prisma.failedLoginAttempt.count({
      where: {
        identifier,
        attemptedAt: {
          gte: new Date(Date.now() - 15 * 60 * 1000), // Last 15 minutes
        },
      },
    });

    const remainingAttempts = Math.max(0, SecurityService.MAX_LOGIN_ATTEMPTS - recentAttempts);

    if (recentAttempts >= SecurityService.MAX_LOGIN_ATTEMPTS) {
      console.warn(`Brute force detected: ${identifier} from ${ipAddress} (${recentAttempts} attempts)`);
      
      // If exceeded, apply lockout
      await prisma.failedLoginAttempt.updateMany({
        where: { identifier, locked: false },
        data: { locked: true },
      });

      return {
        allowed: false,
        remainingAttempts: 0,
        lockoutMinutes: SecurityService.LOCKOUT_DURATION_MINUTES,
      };
    }

    return {
      allowed: true,
      remainingAttempts,
    };
  }

  /**
   * Record a failed login attempt
   */
  async recordFailedAttempt(identifier: string, ipAddress: string, userAgent?: string): Promise<void> {
    await prisma.failedLoginAttempt.create({
      data: {
        identifier,
        ipAddress,
        userAgent,
        attemptedAt: new Date(),
      },
    });
  }

  /**
   * Check for concurrent sessions
   */
  async validateSessionConcurrency(userId: string): Promise<{
    allowed: boolean;
    activeSessions: number;
  }> {
    const activeSessions = await prisma.userSession.count({
      where: {
        userId,
        isActive: true,
        expiresAt: { gte: new Date() },
      },
    });

    return {
      allowed: activeSessions < SecurityService.MAX_CONCURRENT_SESSIONS,
      activeSessions,
    };
  }

  /**
   * Extract device info from request
   */
  extractDeviceInfo(req: Request): {
    ipAddress: string;
    userAgent: string;
    browser: string;
    os: string;
    device: string;
  } {
    const userAgent = req.get('user-agent') || 'Unknown';
    const ipAddress = req.ip || req.socket.remoteAddress || 'Unknown';
    
    // Simple parser - in production use a library like ua-parser-js
    const browser = userAgent.includes('Chrome') ? 'Chrome'
      : userAgent.includes('Firefox') ? 'Firefox'
      : userAgent.includes('Safari') ? 'Safari'
      : userAgent.includes('Edge') ? 'Edge'
      : 'Other';

    const os = userAgent.includes('Windows') ? 'Windows'
      : userAgent.includes('Mac') ? 'MacOS'
      : userAgent.includes('Linux') ? 'Linux'
      : userAgent.includes('Android') ? 'Android'
      : userAgent.includes('iOS') ? 'iOS'
      : 'Other';

    const device = userAgent.includes('Mobile') ? 'Mobile'
      : userAgent.includes('Tablet') ? 'Tablet'
      : 'Desktop';

    return { ipAddress, userAgent, browser, os, device };
  }

  /**
   * Log suspicious activity
   */
  async logSuspiciousActivity(
    userId: string,
    activity: string,
    req: Request,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const deviceInfo = this.extractDeviceInfo(req);

    console.warn(`Suspicious activity [${activity}] for user ${userId} from ${deviceInfo.ipAddress}`);
  }
}

export const securityService = new SecurityService();