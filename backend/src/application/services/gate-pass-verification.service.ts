import { prisma } from '../../infrastructure/database/prisma.service';
import { auditService } from '../../infrastructure/audit/audit.service';
import { notificationService } from '../../infrastructure/notifications/notification.service';
import { NotFoundError, ValidationError } from '../../shared/errors';
import crypto from 'node:crypto';
import QRCode from 'qrcode';

export interface VerificationToken {
  token: string;
  gatePassId: string;
  requestId: string;
  controlNumber: string;
  status: 'generated' | 'ready' | 'verified' | 'released' | 'expired' | 'cancelled';
  expiresAt: Date;
  scanCount: number;
}

export interface VerificationResult {
  success: boolean;
  gatePass: any;
  request: any;
  verification: any;
  message?: string;
  code?: string;
}

export class GatePassVerificationService {
  /**
   * Generate a secure verification token for a gate pass
   * Token is UUID-based, random, and stored in database
   */
  async generateVerificationToken(requestId: string): Promise<string> {
    console.log('[QR] Generating verification token for request:', requestId);
    
    const gatePass = await prisma.gatePass.findUnique({
      where: { requestId },
      include: { request: true },
    });

    console.log('[QR] Gate pass found:', !!gatePass, 'Request found:', !!gatePass?.request);
    console.log('[QR] Request status:', gatePass?.request?.status);

    if (!gatePass || !gatePass.request) {
      console.error('[QR] Gate pass or request not found');
      throw new NotFoundError('Gate pass not found');
    }

    if (gatePass.request.status !== 'approved') {
      console.error('[QR] Request not approved, status:', gatePass.request.status);
      throw new ValidationError('Gate pass must be approved before generating verification token');
    }

    // Generate cryptographically secure random token (32 bytes = 64 hex chars)
    const token = crypto.randomBytes(32).toString('hex');

    // Set expiration: use expected return date or default to 7 days
    const expiresAt = gatePass.expectedReturn 
      ? new Date(gatePass.expectedReturn)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Create verification record
    await prisma.gatePassVerification.create({
      data: {
        gatePassId: gatePass.id,
        requestId: gatePass.requestId,
        verificationToken: token,
        status: 'generated',
        expiresAt,
        scanCount: 0,
      },
    });

    // Update gate pass with token
    await prisma.gatePass.update({
      where: { requestId },
      data: {
        qrToken: token,
        qrGeneratedAt: new Date(),
        expiresAt,
        approvalStage: 'qr_generated',
      },
    });

    // Generate actual QR code image (PNG base64)
    const qrCodeDataUrl = await QRCode.toDataURL(token, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    
    // Extract base64 data from data URL
    const qrCodeBase64 = qrCodeDataUrl.split(',')[1];
    
    await prisma.gatePass.update({
      where: { requestId },
      data: { qrCode: qrCodeBase64 },
    });

    // Audit log
    await auditService.record('generate_qr', 'gate_pass', {
      actorId: gatePass.request.requesterId,
      entityId: gatePass.id,
      metadata: {
        controlNumber: gatePass.request.controlNumber,
        token: token.substring(0, 8) + '...', // Only log partial token
        expiresAt: expiresAt.toISOString(),
      },
    });

    // Notify employee
    await notificationService.notifyUser(gatePass.request.requesterId, {
      title: 'Gate Pass Ready for Verification',
      message: `Your gate pass ${gatePass.request.controlNumber} is ready. Present the QR code to security.`,
      actionUrl: '/app/m/gate-pass',
      requestId: gatePass.requestId,
      controlNumber: gatePass.request.controlNumber,
      metadata: { moduleId: 'gate-pass', status: 'qr_generated' },
    });

    // Notify security
    const securityRole = await prisma.role.findFirst({
      where: { name: { contains: 'security' }, isActive: true },
    });

    if (securityRole) {
      const securityUsers = await prisma.userRole.findMany({
        where: { roleId: securityRole.id },
        include: { user: { select: { id: true } } },
      });

      for (const userRole of securityUsers) {
        await notificationService.notifyUser(userRole.user.id, {
          title: 'New Gate Pass Awaiting Verification',
          message: `Gate pass ${gatePass.request.controlNumber} is ready for security verification`,
          actionUrl: '/app/guard',
          requestId: gatePass.requestId,
          controlNumber: gatePass.request.controlNumber,
          metadata: { moduleId: 'gate-pass', status: 'awaiting_verification' },
        });
      }
    }

    return token;
  }

  /**
   * Validate verification token - called when security scans QR
   */
  async validateVerificationToken(token: string): Promise<VerificationResult> {
    const verification = await prisma.gatePassVerification.findUnique({
      where: { verificationToken: token },
      include: {
        gatePass: {
          include: {
            request: {
              include: {
                requester: {
                  select: {
                    id: true,
                    displayName: true,
                    email: true,
                    employees: {
                      select: {
                        firstName: true,
                        lastName: true,
                        employeeNumber: true,
                        department: { select: { name: true, code: true } },
                        position: { select: { title: true } },
                      },
                    },
                  },
                },
                department: { select: { id: true, name: true, code: true } },
                steps: {
                  orderBy: { stepOrder: 'asc' },
                  include: {
                    actor: {
                      select: {
                        id: true,
                        displayName: true,
                        signaturePath: true,
                      },
                    },
                    role: { select: { id: true, name: true } },
                  },
                },
                actions: {
                  orderBy: { createdAt: 'asc' },
                  include: {
                    actor: {
                      select: {
                        id: true,
                        displayName: true,
                      },
                    },
                  },
                },
              },
            },
            vehicle: {
              select: {
                id: true,
                plateNumber: true,
                brand: true,
                model: true,
                vehicleType: true,
              },
            },
          },
        },
      },
    });

    if (!verification) {
      return {
        success: false,
        gatePass: null,
        request: null,
        verification: null,
        message: 'Invalid QR Code',
        code: 'INVALID_TOKEN',
      };
    }

    const gatePass = verification.gatePass;
    const request = gatePass?.request;

    if (!gatePass || !request) {
      return {
        success: false,
        gatePass: null,
        request: null,
        verification: null,
        message: 'Gate pass not found',
        code: 'NOT_FOUND',
      };
    }

    // Check if already released
    if (verification.status === 'released') {
      return {
        success: false,
        gatePass,
        request,
        verification,
        message: `Already Released on ${verification.releasedAt?.toLocaleString()}`,
        code: 'ALREADY_RELEASED',
      };
    }

    // Check if expired
    if (verification.expiresAt && new Date() > verification.expiresAt) {
      await prisma.gatePassVerification.update({
        where: { id: verification.id },
        data: { status: 'expired' },
      });
      return {
        success: false,
        gatePass,
        request,
        verification,
        message: 'QR Code has expired',
        code: 'EXPIRED',
      };
    }

    // Check if approved
    if (request.status !== 'approved') {
      return {
        success: false,
        gatePass,
        request,
        verification,
        message: 'Gate pass is not approved',
        code: 'NOT_APPROVED',
      };
    }

    // Increment scan count
    await prisma.gatePassVerification.update({
      where: { id: verification.id },
      data: {
        scanCount: { increment: 1 },
        scannedAt: new Date(),
        status: 'ready',
      },
    });

    return {
      success: true,
      gatePass,
      request,
      verification: {
        ...verification,
        status: 'ready',
      },
      message: 'QR code validated successfully',
    };
  }

  /**
   * Release gate pass - called when security confirms exit
   */
  async releaseGatePass(
    token: string,
    securityUserId: string,
    securityUserName: string,
    data: {
      kmReadingStart?: number;
      kmReadingEnd?: number;
      withMeal?: boolean;
      mealAmount?: number;
      timeOut: Date;
      timeIn?: Date;
      remarks?: string;
    }
  ): Promise<VerificationResult> {
    const verification = await prisma.gatePassVerification.findUnique({
      where: { verificationToken: token },
      include: {
        gatePass: {
          include: {
            request: {
              include: {
                requester: { select: { id: true, displayName: true } },
              },
            },
          },
        },
      },
    });

    if (!verification || !verification.gatePass) {
      throw new NotFoundError('Invalid verification token');
    }

    const gatePass = verification.gatePass;
    const request = gatePass.request;

    if (request.status !== 'approved') {
      throw new ValidationError('Gate pass must be approved before release');
    }

    if (verification.status === 'released') {
      return {
        success: false,
        gatePass,
        request,
        verification,
        message: 'Gate pass already released',
        code: 'ALREADY_RELEASED',
      };
    }

    // Get security guard's employee record
    const guardEmployee = await prisma.employee.findUnique({
      where: { userId: securityUserId },
      select: { id: true, firstName: true, lastName: true, employeeNumber: true },
    });

    // Fetch request with steps for notifications
    const requestWithSteps = await prisma.approvalRequest.findUnique({
      where: { id: request.id },
      include: {
        steps: true,
        requester: { select: { displayName: true } },
      },
    });

    // Single transaction for all updates
    const result = await prisma.$transaction(async (tx) => {
      // Update verification record
      const updatedVerification = await tx.gatePassVerification.update({
        where: { id: verification.id },
        data: {
          status: 'released',
          releasedAt: data.timeOut,
          releasedBy: securityUserId,
          guardEmployeeId: guardEmployee?.id,
          guardIPAddress: undefined, // Will be set by controller
          guardDevice: undefined,
          guardBrowser: undefined,
          remarks: data.remarks,
        },
      });

      // Update gate pass
      const updatedGatePass = await tx.gatePass.update({
        where: { requestId: gatePass.requestId },
        data: {
          securityReleasedBy: securityUserId,
          securityReleasedAt: data.timeOut,
          actualReturn: data.timeIn,
          isUsed: true,
          isVerified: true,
          verifiedAt: data.timeOut,
          verifiedBy: securityUserId,
          printCount: { increment: 1 },
        },
      });

      // Update request status to completed
      const updatedRequest = await tx.approvalRequest.update({
        where: { id: request.id },
        data: {
          status: 'completed',
          completedAt: data.timeOut,
        },
      });

      // Complete the security release step
      await tx.approvalStep.updateMany({
        where: {
          requestId: request.id,
          name: { contains: 'Security' },
        },
        data: {
          status: 'approved',
          actorId: securityUserId,
          actedAt: data.timeOut,
          note: data.remarks,
        },
      });

      // Create approval action
      await tx.approvalAction.create({
        data: {
          requestId: request.id,
          action: 'release',
          actorId: securityUserId,
          note: data.remarks,
          metadata: {
            releasedAt: data.timeOut,
            kmReadingStart: data.kmReadingStart,
            kmReadingEnd: data.kmReadingEnd,
            withMeal: data.withMeal,
            mealAmount: data.mealAmount,
            guardName: securityUserName,
            guardEmployeeNumber: guardEmployee?.employeeNumber,
          },
        },
      });

      // Create audit log
      await auditService.record('release', 'gate_pass', {
        actorId: securityUserId,
        entityId: gatePass.id,
        targetId: request.id,
        metadata: {
          controlNumber: request.controlNumber,
          token: token.substring(0, 8) + '...',
          kmReadingStart: data.kmReadingStart,
          kmReadingEnd: data.kmReadingEnd,
          withMeal: data.withMeal,
          mealAmount: data.mealAmount,
          releasedAt: data.timeOut,
          guardName: securityUserName,
        },
      });

      return { verification: updatedVerification, gatePass: updatedGatePass, request: updatedRequest };
    });

    // Notify requester
    await notificationService.notifyUser(request.requesterId, {
      title: 'Gate Pass Released',
      message: `Your gate pass ${request.controlNumber} has been released by Security`,
      actionUrl: '/app/m/gate-pass',
      requestId: request.id,
      controlNumber: request.controlNumber,
      metadata: { moduleId: 'gate-pass', status: 'released' },
    });

    // Notify supervisor
    const supervisorStep = requestWithSteps?.steps.find((s: any) => s.name.toLowerCase().includes('recommend'));
    if (supervisorStep?.actorId) {
      await notificationService.notifyUser(supervisorStep.actorId, {
        title: 'Gate Pass Successfully Completed',
        message: `Employee ${requestWithSteps?.requester?.displayName || request.requesterId} has been successfully released with gate pass ${request.controlNumber}`,
        actionUrl: '/app/m/gate-pass',
        requestId: request.id,
        controlNumber: request.controlNumber,
        metadata: { moduleId: 'gate-pass', status: 'completed' },
      });
    }

    // Notify GAD
    const gadStep = requestWithSteps?.steps.find((s: any) => s.name.toLowerCase().includes('gad'));
    if (gadStep?.actorId) {
      await notificationService.notifyUser(gadStep.actorId, {
        title: 'Gate Pass Successfully Completed',
        message: `Gate pass ${request.controlNumber} has been released by security`,
        actionUrl: '/app/m/gate-pass',
        requestId: request.id,
        controlNumber: request.controlNumber,
        metadata: { moduleId: 'gate-pass', status: 'completed' },
      });
    }

    return {
      success: true,
      gatePass: result.gatePass,
      request: result.request,
      verification: result.verification,
      message: 'Gate pass released successfully',
    };
  }

  /**
   * Get verification status by token
   */
  async getVerificationStatus(token: string): Promise<VerificationToken | null> {
    const verification = await prisma.gatePassVerification.findUnique({
      where: { verificationToken: token },
      select: {
        token: true,
        gatePassId: true,
        requestId: true,
        status: true,
        expiresAt: true,
        scanCount: true,
        scannedAt: true,
        releasedAt: true,
        releasedBy: true,
        remarks: true,
      },
    });

    if (!verification) return null;

    return {
      token: verification.token,
      gatePassId: verification.gatePassId,
      requestId: verification.requestId,
      controlNumber: '', // Not stored in verification table
      status: verification.status as any,
      expiresAt: verification.expiresAt,
      scanCount: verification.scanCount,
    };
  }

  /**
   * Cancel verification token
   */
  async cancelVerification(token: string, cancelledBy: string, reason: string): Promise<void> {
    const verification = await prisma.gatePassVerification.findUnique({
      where: { verificationToken: token },
      include: { gatePass: true },
    });

    if (!verification) {
      throw new NotFoundError('Verification token not found');
    }

    if (verification.status === 'released') {
      throw new ValidationError('Cannot cancel a released verification');
    }

    await prisma.gatePassVerification.update({
      where: { id: verification.id },
      data: { status: 'cancelled' },
    });

    // Clear QR token from gate pass
    await prisma.gatePass.update({
      where: { requestId: verification.requestId },
      data: {
        qrToken: null,
        qrCode: null,
        expiresAt: null,
        approvalStage: 'approved',
      },
    });

    // Audit log
    const gpForAudit = await prisma.gatePass.findUnique({
      where: { id: verification.gatePassId },
      include: { request: { select: { controlNumber: true } } },
    });
    await auditService.record('cancel_verification', 'gate_pass', {
      actorId: cancelledBy,
      entityId: verification.gatePassId,
      metadata: {
        token: token.substring(0, 8) + '...',
        reason,
        controlNumber: gpForAudit?.request?.controlNumber,
      },
    });
  }
}

export const gatePassVerificationService = new GatePassVerificationService();