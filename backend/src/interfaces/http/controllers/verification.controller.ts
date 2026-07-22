import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../infrastructure/database/prisma.service';
import { gatePassVerificationService } from '../../../application/services/gate-pass-verification.service';
import { NotFoundError, ValidationError } from '../../../shared/errors';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../../../infrastructure/auth/rbac.middleware';
import { auditService } from '../../../infrastructure/audit/audit.service';

export const verificationController = {
  /**
   * Validate verification token (public endpoint for QR scan)
   * @route   GET /api/v1/verify/:token
   * @desc    Validate QR token and return gate pass details
   * @access  Public (but requires security role after login for release)
   */
  validateToken: [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { token } = req.params;
        
        if (!token) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Verification token is required',
            },
          });
        }

        const result = await gatePassVerificationService.validateVerificationToken(token);

        // Log scan attempt (even if invalid)
        try {
          await auditService.record(
            'scan_qr',
            'gate_pass',
            {
              actorId: req.user?.id,
              actorName: req.user?.displayName,
              metadata: {
                token: token.substring(0, 8) + '...',
                success: result.success,
                code: result.code,
                controlNumber: result.request?.controlNumber,
              },
            }
          );
        } catch (auditError) {
          // Non-critical - don't fail the scan for audit issues
          console.warn('[VERIFY] Audit log failed:', auditError);
        }

        if (!result.success) {
          // CRITICAL: ALREADY_COMPLETED means QR is permanently invalid
          // Return HTTP 200 so frontend reads the code, but NO database was mutated
          if (result.code === 'ALREADY_COMPLETED') {
            return res.status(200).json({
              success: false,
              error: {
                code: 'ALREADY_COMPLETED',
                message: result.message || 'This Gate Pass has already been completed. QR code is permanently invalid.',
              },
              data: {
                gatePass: result.gatePass,
                request: result.request,
                verification: result.verification,
                code: 'ALREADY_COMPLETED',
              },
            });
          }

          // Handle EXPIRED QR codes - QR tokens past their expiration date
          if (result.code === 'EXPIRED') {
            return res.status(200).json({
              success: false,
              error: {
                code: 'EXPIRED',
                message: result.message || 'This QR Code has expired.',
              },
              data: result.gatePass ? {
                gatePass: result.gatePass,
                request: result.request,
                verification: result.verification,
                code: 'EXPIRED',
              } : null,
            });
          }

          // Handle ALREADY_RELEASED - QR was already used for exit, waiting for return
          if (result.code === 'ALREADY_RELEASED') {
            return res.status(200).json({
              success: false,
              error: {
                code: 'ALREADY_RELEASED',
                message: result.message || 'This Gate Pass has already been released. Process return.',
              },
              data: result.gatePass ? {
                gatePass: result.gatePass,
                request: result.request,
                verification: {
                  ...result.verification,
                  mode: 'gate_in',
                  isAlreadyReleased: true,
                },
              } : null,
            });
          }

          // Return HTTP 200 for business status failures (expired, already released, etc.)
          // This allows the frontend to display proper verification panels
          return res.status(200).json({
            success: false,
            error: {
              code: result.code,
              message: result.message,
            },
            data: result.gatePass ? {
              gatePass: result.gatePass,
              request: result.request,
              verification: result.verification,
            } : null,
          });
        }

        return res.json({
          success: true,
          data: {
            gatePass: result.gatePass,
            request: result.request,
            verification: result.verification,
          },
        });
      } catch (error) {
        console.error('Token validation error:', error);
        next(error);
      }
    },
  ],

  /**
   * Release gate pass (requires authentication + security role)
   * @route   POST /api/v1/verify/:token/release
   * @desc    Release gate pass after security verification
   * @access  Private (Security or Super Admin only)
   */
  releaseGatePass: [
    authenticate,
    requirePermission('gate-pass', 'edit'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as any;
        const { token } = req.params;
        const {
          kmReadingStart,
          kmReadingEnd,
          plateNumber,
          driverName,
          withMeal,
          mealAmount,
          timeOut,
          timeIn,
          remarks,
        } = req.body;

        if (!token) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Verification token is required',
            },
          });
        }

        // Get guard info
        const guardName = user.displayName || 'Security Guard';
        const guardEmployee = await prisma.employee.findUnique({
          where: { userId: user.id },
          select: { employeeNumber: true },
        });

        const clientIp =
          (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
          req.socket.remoteAddress ||
          "unknown";

        const deviceInfo = req.headers["sec-ch-ua-platform"] || "unknown";
        const browserInfo = req.headers["user-agent"] || "unknown";

        // Auto-generate releasedAt server-side - NEVER trust client timestamps
        const serverTime = new Date();

        const result = await gatePassVerificationService.releaseGatePass(
          token,
          user.id,
          guardName,
          {
            kmReadingStart,
            kmReadingEnd,
            plateNumber,
            driverName,
            withMeal,
            mealAmount,
            timeOut: serverTime,  // Auto-generated server time - Security NEVER enters time
            timeIn: undefined,     // Generated on return
            remarks: remarks || "Released via QR security scan",
            ipAddress: clientIp,
            device: String(deviceInfo),
            browser: String(browserInfo),
          } as any
        );

        // Check if verification was rejected due to ALREADY_COMPLETED
        if (!result.success && result.code === 'ALREADY_COMPLETED') {
          return res.status(200).json({
            success: false,
            error: {
              code: 'ALREADY_COMPLETED',
              message: result.message || 'This Gate Pass has already been completed.',
            },
            data: result,
          });
        }

        // Audit log for release
        await auditService.record('release_gate_pass', 'gate_pass', {
          actorId: user.id,
          metadata: {
            controlNumber: result.request.controlNumber,
            token: token.substring(0, 8) + '...',
            guardName,
            guardEmployeeNumber: guardEmployee?.employeeNumber,
            kmReadingStart,
            kmReadingEnd,
            plateNumber,
            driverName,
            withMeal,
            mealAmount,
            releasedAt: new Date().toISOString(),
            ipAddress: clientIp,
            device: String(deviceInfo),
            browser: String(browserInfo),
          },
        });

        return res.json({
          success: true,
          data: result,
          message: 'Gate pass released successfully',
        });
      } catch (error) {
        console.error('Release gate pass error:', error);
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
            },
          });
        }
        next(error);
      }
    },
  ],

  /**
   * Get verification status
   * @route   GET /api/v1/verify/:token/status
   * @desc    Get verification status by token
   * @access  Public
   */
  getStatus: [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { token } = req.params;
        
        if (!token) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Verification token is required',
            },
          });
        }

        const status = await gatePassVerificationService.getVerificationStatus(token);

        if (!status) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Verification token not found',
            },
          });
        }

        return res.json({
          success: true,
          data: status,
        });
      } catch (error) {
        console.error('Get status error:', error);
        next(error);
      }
    },
  ],

  /**
   * Cancel verification (admin only)
   * @route   POST /api/v1/verify/:token/cancel
   * @desc    Cancel a verification token
   * @access  Private (Admin/Super Admin only)
   */
  cancelVerification: [
    authenticate,
    requirePermission('gate-pass', 'edit'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as any;
        const { token } = req.params;
        const { reason } = req.body;

        if (!token) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Verification token is required',
            },
          });
        }

        await gatePassVerificationService.cancelVerification(token, user.id, reason || 'Cancelled by admin');

        return res.json({
          success: true,
          message: 'Verification cancelled successfully',
        });
      } catch (error) {
        console.error('Cancel verification error:', error);
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
            },
          });
        }
        next(error);
      }
    },
  ],

  /**
   * Process employee return - called when security scans QR on return
   * @route   POST /api/v1/verify/:token/return
   * @desc    Process employee return with trip duration and OB meal calculation
   * @access  Private (Security or Super Admin only)
   */
  processReturn: [
    authenticate,
    requirePermission('gate-pass', 'edit'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as any;
        const { token } = req.params;
        const {
          kmReadingEnd,
          returnRemarks,
          obMealEnabled,
          obMealAmount,
        } = req.body;

        if (!token) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Verification token is required',
            },
          });
        }

        const guardName = user.displayName || 'Security Guard';
        const guardEmployee = await prisma.employee.findUnique({
          where: { userId: user.id },
          select: { employeeNumber: true },
        });

        const clientIp =
          (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
          req.socket.remoteAddress ||
          "unknown";

        const deviceInfo = req.headers["sec-ch-ua-platform"] || "unknown";
        const browserInfo = req.headers["user-agent"] || "unknown";

        const result = await gatePassVerificationService.processReturn(
          token,
          user.id,
          guardName,
          {
            kmReadingEnd,
            returnRemarks,
            obMealEnabled,
            obMealAmount,
            ipAddress: clientIp,
            device: String(deviceInfo),
            browser: String(browserInfo),
          }
        );

        await auditService.record('process_return', 'gate_pass', {
          actorId: user.id,
          metadata: {
            controlNumber: result.request?.controlNumber,
            token: token.substring(0, 8) + '...',
            guardName,
            guardEmployeeNumber: guardEmployee?.employeeNumber,
            kmReadingEnd,
            obMealEnabled,
            obMealAmount,
            ipAddress: clientIp,
            device: String(deviceInfo),
            browser: String(browserInfo),
          },
        });

        return res.json({
          success: result.success,
          data: result,
          message: result.message,
        });
      } catch (error) {
        console.error('Process return error:', error);
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
            },
          });
        }
        next(error);
      }
    },
  ],
};
