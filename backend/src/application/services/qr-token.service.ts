import { prisma } from '../../infrastructure/database/prisma.service';
import crypto from 'node:crypto';
import { NotFoundError, ValidationError } from '../../shared/errors';

export interface QRTokenData {
  controlNumber: string;
  requestId: string;
  purpose: string;
  destination?: string;
  expectedReturn?: Date;
  timestamp: string;
}

export class QRTokenService {
  /**
   * Generate a unique QR token for a gate pass
   */
  async generateToken(requestId: string): Promise<string> {
    const gatePass = await prisma.gatePass.findUnique({
      where: { requestId },
      include: { request: true },
    });

    if (!gatePass || !gatePass.request) {
      throw new NotFoundError('Gate pass not found');
    }

    if (gatePass.request.status !== 'approved') {
      throw new ValidationError('QR code can only be generated for approved gate passes');
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set expiration: 7 days from generation (independent of expectedReturn)
    // expectedReturn is the employee's schedule, not QR validity period
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Update gate pass with QR token
    await prisma.gatePass.update({
      where: { requestId },
      data: {
        qrToken: token,
        qrGeneratedAt: new Date(),
        expiresAt: expiresAt,
      },
    });

    // Generate QR code data
    const qrData: QRTokenData = {
      controlNumber: gatePass.request.controlNumber,
      requestId,
      purpose: gatePass.purpose,
      destination: gatePass.destination || undefined,
      expectedReturn: gatePass.expectedReturn || undefined,
      timestamp: new Date().toISOString(),
    };

    const qrCode = Buffer.from(JSON.stringify(qrData)).toString('base64');

    // Update with QR code
    await prisma.gatePass.update({
      where: { requestId },
      data: { qrCode: qrCode },
    });

    return token;
  }

  /**
   * Validate and retrieve gate pass by QR token
   * Follows strict QR lifecycle: 
   * Generated → Waiting Scan → Verified → Released → Outside → Returned → Completed → Invalid Forever
   * Once Completed or Expired, QR can NEVER be scanned again
   */
  async validateToken(token: string) {
    const gatePass = await prisma.gatePass.findUnique({
      where: { qrToken: token },
      include: {
        request: {
          include: {
            requester: {
              select: {
                id: true,
                displayName: true,
                email: true,
              },
            },
            department: true,
            gatePass: {
              include: {
                vehicle: true,
              },
            },
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
                role: true,
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
      },
    });

    if (!gatePass) {
      throw new NotFoundError('Invalid QR code');
    }

    // CRITICAL: Check if gate pass is permanently completed (terminal state)
    // Once completed, QR can NEVER be scanned again - no database updates
    if (gatePass.releaseStatus === 'completed' || 
        gatePass.request.status === 'completed' ||
        (gatePass.isUsed && (gatePass as any).completedAt)) {
      throw new ValidationError('QR CODE ALREADY USED - This Gate Pass has already been completed.', 'ALREADY_COMPLETED');
    }

    // Check if already used (released but not yet returned - still scannable for return)
    if (gatePass.isUsed && gatePass.releaseStatus === 'released') {
      // This is a RETURN scan - employee is coming back
      // Return the gate pass info for return mode processing
      return {
        gatePass,
        request: gatePass.request,
        isValid: true,
        mode: 'return',
      };
    }

    // Check if already expired - LOCKED FOREVER, no database updates
    if (gatePass.expiresAt && new Date() > gatePass.expiresAt) {
      throw new ValidationError('QR CODE EXPIRED - This QR code is no longer valid.', 'EXPIRED');
    }

    // Check if approved
    if (gatePass.request.status !== 'approved') {
      throw new ValidationError('Gate pass is not approved', 'NOT_APPROVED');
    }

    return {
      gatePass,
      request: gatePass.request,
      isValid: true,
      mode: 'exit',
    };
  }

  /**
   * Check if QR code is permanently invalid (completed state)
   * No database updates allowed - read-only validation
   */
  async isPermanentlyInvalid(token: string): Promise<{ invalid: boolean; reason?: string }> {
    const gatePass = await prisma.gatePass.findUnique({
      where: { qrToken: token },
      select: {
        releaseStatus: true,
        isUsed: true,
        completedAt: true,
        request: { select: { status: true } },
      },
    });

    if (!gatePass) {
      return { invalid: true, reason: 'QR CODE NOT FOUND' };
    }

    if (gatePass.releaseStatus === 'completed' || gatePass.request?.status === 'completed') {
      return { invalid: true, reason: 'QR CODE ALREADY USED - This Gate Pass has already been completed.' };
    }

    return { invalid: false };
  }

  /**
   * Mark QR code as used (after security verification)
   */
  async markAsUsed(token: string, verifiedBy: string) {
    const gatePass = await prisma.gatePass.findUnique({
      where: { qrToken: token },
      include: {
        request: {
          select: {
            controlNumber: true,
          },
        },
      },
    });

    if (!gatePass) {
      throw new NotFoundError('Gate pass not found');
    }

    if (gatePass.isUsed) {
      throw new ValidationError('Gate Pass Already Used', 'ALREADY_USED');
    }

    // Update gate pass
    await prisma.gatePass.update({
      where: { qrToken: token },
      data: {
        isUsed: true,
        isVerified: true,
        verifiedAt: new Date(),
        verifiedBy: verifiedBy,
      },
    });

    // Update request status to completed
    await prisma.approvalRequest.update({
      where: { id: gatePass.requestId },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });

    // Log QR scan
    await prisma.qRScanLog.create({
      data: {
        qrCode: token,
        requestId: gatePass.requestId,
        scannedBy: verifiedBy,
        action: 'verify',
        metadata: {
          controlNumber: gatePass.request.controlNumber,
          verified: true,
        },
      },
    });

    return { success: true };
  }

  /**
   * Log QR scan attempt
   */
  async logScan(token: string, scannedBy: string, action: string, metadata?: any) {
    await prisma.qRScanLog.create({
      data: {
        qrCode: token,
        scannedBy,
        action,
        metadata,
      },
    });
  }

  /**
   * Get QR scan history for a gate pass
   */
  async getScanHistory(requestId: string) {
    const logs = await prisma.qRScanLog.findMany({
      where: { requestId },
      orderBy: { scannedAt: 'desc' },
      include: {
        scanner: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });

    return logs;
  }
}

export const qrTokenService = new QRTokenService();