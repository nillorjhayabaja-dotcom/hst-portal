import type { Request, Response } from 'express';
import { prisma } from '../../../infrastructure/database/prisma.service';
import { qrTokenService } from '../../../application/services/qr-token.service';
import { auditService } from '../../../infrastructure/audit/audit.service';
import { NotFoundError, ValidationError } from '../../../shared/errors';

export class QRScannerController {
  /**
   * Validate QR token and return gate pass details
   */
  async validateQRToken(req: Request, res: Response) {
    try {
      const { token } = req.body;
      const guardId = req.user?.id;

      if (!token) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'QR token is required',
          },
        });
      }

      const validationResult = await qrTokenService.validateToken(token);

      await qrTokenService.logScan(
        token,
        guardId || 'system',
        'scan',
        {
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          action: 'validate',
        }
      );

      await auditService.record('scan_qr', 'gate_pass', {
        actorId: guardId || 'system',
        entityId: validationResult.gatePass.id,
        metadata: {
          controlNumber: validationResult.request.controlNumber,
          action: 'validate',
          valid: true,
        },
      });

      return res.json({
        success: true,
        data: {
          gatePass: validationResult.gatePass,
          request: validationResult.request,
          isValid: validationResult.isValid,
          status: validationResult.request?.status,
        },
      });
    } catch (error) {
      console.error('QR validation error:', error);

      try {
        const { token } = req.body;
        const guardId = req.user?.id;
        
        await qrTokenService.logScan(
          token || 'unknown',
          guardId || 'system',
          'scan_failed',
          {
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            action: 'validate_failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          }
        );

        await auditService.record('scan_qr_failed', 'gate_pass', {
          actorId: guardId || 'system',
          metadata: {
            token: token || 'unknown',
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      } catch (auditError) {
        console.error('Audit log error:', auditError);
      }

      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: error.message,
          },
        });
      }

      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
            details: (error as ValidationError).details,
          },
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to validate QR code',
        },
      });
    }
  }

  /**
   * Mark gate pass as verified/used by security guard
   */
  async verifyExit(req: Request, res: Response) {
    try {
      const { token } = req.body;
      const guardId = req.user?.id;
      const guardName = req.user?.displayName || 'Security Guard';

      if (!token) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'QR token is required',
          },
        });
      }

      if (!guardId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Guard authentication required',
          },
        });
      }

      const result = await qrTokenService.markAsUsed(token, guardId);

      const gatePass = await prisma.gatePass.findUnique({
        where: { qrToken: token },
        include: {
          request: {
            select: {
              controlNumber: true,
              requesterId: true,
            },
          },
        },
      });

      if (gatePass) {
        await prisma.verification.create({
          data: {
            gatePassId: gatePass.id,
            verifiedBy: guardName,
            guardId,
            scanTime: new Date(),
            ipAddress: req.ip,
            device: req.get('user-agent'),
            remarks: 'Exit verified by security',
          },
        });

        await prisma.gatePass.update({
          where: { id: gatePass.id },
          data: {
            completedAt: new Date(),
            actualReturn: new Date(),
          },
        });

        await auditService.record('verify_exit', 'gate_pass', {
          actorId: guardId,
          entityId: gatePass.id,
          metadata: {
            controlNumber: gatePass.request.controlNumber,
            action: 'security_verification',
            verifiedBy: guardName,
          },
        });

        await prisma.notification.create({
          data: {
            type: 'gate_pass_completed',
            title: 'Gate Pass Completed',
            message: `Your gate pass ${gatePass.request.controlNumber} has been verified and completed`,
            recipientId: gatePass.request.requesterId,
            requestId: gatePass.requestId,
            controlNumber: gatePass.request.controlNumber,
            moduleId: 'gate-pass',
            actionUrl: '/app/m/gate-pass',
          },
        });
      }

      return res.json({
        success: true,
        message: 'Exit verified successfully',
        data: result,
      });
    } catch (error) {
      console.error('Exit verification error:', error);

      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: error.message,
          },
        });
      }

      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
            details: (error as ValidationError).details,
          },
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to verify exit',
        },
      });
    }
  }

  /**
   * Get scan history for a gate pass
   */
  async getScanHistory(req: Request, res: Response) {
    try {
      const { requestId } = req.params;

      if (!requestId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request ID is required',
          },
        });
      }

      const gatePass = await prisma.gatePass.findUnique({
        where: { requestId },
        select: { id: true },
      });

      if (!gatePass) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Gate pass not found',
          },
        });
      }

      const scanLogs = await qrTokenService.getScanHistory(requestId);
      const verifications = await prisma.verification.findMany({
        where: { gatePassId: gatePass.id },
        orderBy: { scanTime: 'desc' },
      });

      return res.json({
        success: true,
        data: {
          scanLogs,
          verifications,
        },
      });
    } catch (error) {
      console.error('Get scan history error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get scan history',
        },
      });
    }
  }
}