import { prisma } from '../../infrastructure/database/prisma.service';
import { qrTokenService } from './qr-token.service';
import { auditService } from '../../infrastructure/audit/audit.service';
import { notificationService } from '../../infrastructure/notifications/notification.service';
import { NotFoundError, ValidationError } from '../../shared/errors';

export class GatePassQRService {
  /**
   * Verify QR token and return gate pass details
   */
  async verifyQRToken(token: string, scannedBy: string) {
    const validation = await qrTokenService.validateToken(token);
    
    // Log the scan attempt
    await qrTokenService.logScan(token, scannedBy, 'scan', {
      controlNumber: validation.request.controlNumber,
    });

    return {
      success: true,
      data: {
        gatePass: validation.gatePass,
        request: validation.request,
        isValid: validation.isValid,
      },
    };
  }

  /**
   * Confirm QR verification (security guard verifies exit)
   */
  async confirmVerification(token: string, securityUserId: string, data: {
    kmReadingStart?: number;
    kmReadingEnd?: number;
    withMeal?: boolean;
    mealAmount?: number;
    timeOut?: string;
    timeIn?: string;
  }) {
    const validation = await qrTokenService.validateToken(token);
    
    // Mark QR as used
    await qrTokenService.markAsUsed(token, securityUserId);

    // Update gate pass with security check data
    await prisma.gatePass.update({
      where: { requestId: validation.gatePass.requestId },
      data: {
        securityReleasedBy: securityUserId,
        securityReleasedAt: data.timeOut ? new Date(data.timeOut) : new Date(),
        actualReturn: data.timeIn ? new Date(data.timeIn) : undefined,
        printCount: (validation.gatePass.printCount || 0) + 1,
      },
    });

    // Update request status to completed
    await prisma.approvalRequest.update({
      where: { id: validation.gatePass.requestId },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });

    // Audit log
    await auditService.record('verify', 'gate_pass', {
      actorId: securityUserId,
      entityId: validation.gatePass.id,
      metadata: {
        controlNumber: validation.request.controlNumber,
        kmReadingStart: data.kmReadingStart,
        kmReadingEnd: data.kmReadingEnd,
        withMeal: data.withMeal,
        mealAmount: data.mealAmount,
        timeOut: data.timeOut,
        timeIn: data.timeIn,
      },
    });

    // Notify requester
    await notificationService.notifyUser(validation.request.requesterId, {
      title: 'Gate Pass Verified',
      message: `Your gate pass ${validation.request.controlNumber} has been verified by Security`,
      actionUrl: '/app/m/gate-pass',
      requestId: validation.gatePass.requestId,
      controlNumber: validation.request.controlNumber,
      metadata: { moduleId: 'gate-pass', status: 'completed' },
    });

    return {
      success: true,
      message: 'Gate pass verified successfully',
      data: {
        gatePass: validation.gatePass,
        request: validation.request,
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