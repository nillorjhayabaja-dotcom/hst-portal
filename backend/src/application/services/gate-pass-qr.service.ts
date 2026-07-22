import { prisma } from '../../infrastructure/database/prisma.service';
import { qrTokenService } from './qr-token.service';
import { auditService } from '../../infrastructure/audit/audit.service';
import { notificationService } from '../../infrastructure/notifications/notification.service';
import { NotFoundError, ValidationError } from '../../shared/errors';
import { gatePassVerificationService } from './gate-pass-verification.service';

export class GatePassQRService {
  /**
   * Verify QR token and return gate pass details
   * This ONLY validates the QR - it does NOT release the gate pass
   */
  async verifyQRToken(token: string, scannedBy: string) {
    const validation = await gatePassVerificationService.validateVerificationToken(token);
    
    // Log the scan attempt
    await qrTokenService.logScan(token, scannedBy, 'scan', {
      controlNumber: validation.request?.controlNumber,
    });

    return {
      success: validation.success,
      data: {
        gatePass: validation.gatePass,
        request: validation.request,
        verification: validation.verification,
        isValid: validation.success,
        message: validation.message,
        code: validation.code,
      },
    };
  }

  /**
   * Confirm QR verification and release gate pass (Security Release Form submission)
   * This is called when the security guard clicks "Release Employee"
   */
  async confirmVerification(token: string, securityUserId: string, data: {
    kmReadingStart?: number;
    kmReadingEnd?: number;
    plateNumber?: string;
    driverName?: string;
    withMeal?: boolean;
    mealAmount?: number;
    timeOut?: string;
    timeIn?: string;
    remarks?: string;
    ipAddress?: string;
    device?: string;
    browser?: string;
  }) {
    // Get security user's display name
    const securityUser = await prisma.user.findUnique({
      where: { id: securityUserId },
      select: { displayName: true },
    });

    if (!securityUser) {
      throw new NotFoundError('Security user not found');
    }

    // Use the comprehensive release method from verification service
    const result = await gatePassVerificationService.releaseGatePass(
      token,
      securityUserId,
      securityUser.displayName,
      {
        kmReadingStart: data.kmReadingStart || 0,
        kmReadingEnd: data.kmReadingEnd,
        plateNumber: data.plateNumber,
        driverName: data.driverName,
        timeOut: data.timeOut ? new Date(data.timeOut) : new Date(),
        timeIn: data.timeIn ? new Date(data.timeIn) : undefined,
        remarks: data.remarks,
        ipAddress: data.ipAddress,
        device: data.device,
        browser: data.browser,
      }
    );

    return {
      success: result.success,
      message: result.message,
      code: result.code,
      data: {
        gatePass: result.gatePass,
        request: result.request,
        verification: result.verification,
      },
    };
  }

  /**
   * Get QR scan history for a gate pass
   */
  async getScanHistory(requestId: string) {
    return qrTokenService.getScanHistory(requestId);
  }
}

export const gatePassQRService = new GatePassQRService();