import { prisma } from '../../infrastructure/database/prisma.service';
import { auditService } from '../../infrastructure/audit/audit.service';
import { notificationService } from '../../infrastructure/notifications/notification.service';
import { NotFoundError, ValidationError } from '../../shared/errors';
import { gatePassTimelineService } from './gate-pass-timeline.service';
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

    // Set expiration: 7 days from generation (independent of expectedReturn)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

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
        token: token.substring(0, 8) + '...',
        expiresAt: expiresAt.toISOString(),
      },
    });

    // Create timeline event
    await gatePassTimelineService.createEvent({
      gatePassId: gatePass.id,
      eventType: 'qr_generated',
      actorId: gatePass.request.requesterId,
      actorName: (gatePass.request as any).requester?.displayName,
      description: 'QR code generated for security verification',
      metadata: {
        controlNumber: gatePass.request.controlNumber,
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
   * Strict lifecycle: 
   * Validate QR → Validate Status → Validate Expiration → Load Information
   * Never automatically release.
   * Once Completed → QR Invalid Forever → Scanner Rejects
   */
  async validateVerificationToken(token: string): Promise<VerificationResult> {
    console.log('[VERIFY] ========== START TOKEN VALIDATION ==========');
    console.log('[VERIFY] Token received:', token.substring(0, 8) + '...');

    // STAGE 1: QR Token Lookup
    console.log('[VERIFY] STAGE 1: Looking up verification token...');
    let verification: any;
    try {
      verification = await prisma.gatePassVerification.findUnique({
        where: { verificationToken: token },
        include: {
          gatePass: {
            include: {
              request: {
                include: {
                  requester: {
                    include: {
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
                  status: true,
                },
              },
              transportationAssignment: {
                include: {
                  vehicle: {
                    select: {
                      id: true,
                      plateNumber: true,
                      brand: true,
                      model: true,
                      vehicleType: true,
                      status: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
      console.log('[VERIFY] STAGE 1: ✓ Verification record found:', !!verification);
    } catch (error) {
      console.error('[VERIFY] STAGE 1: ✗ Database error during token lookup:', error);
      throw error;
    }

    if (!verification) {
      console.log('[VERIFY] STAGE 1: ✗ Verification token not found in database');
      return {
        success: false,
        gatePass: null,
        request: null,
        verification: null,
        message: 'Invalid QR Code',
        code: 'INVALID_TOKEN',
      };
    }

    // STAGE 2: GatePass and Request Loading
    console.log('[VERIFY] STAGE 2: Loading GatePass and Request relations...');
    const gatePass = verification.gatePass;
    const request = gatePass?.request;

    console.log('[VERIFY] STAGE 2: GatePass found:', !!gatePass);
    console.log('[VERIFY] STAGE 2: Request found:', !!request);

    if (!gatePass || !request) {
      console.log('[VERIFY] STAGE 2: ✗ GatePass or Request is null');
      return {
        success: false,
        gatePass: null,
        request: null,
        verification: null,
        message: 'Gate pass not found',
        code: 'NOT_FOUND',
      };
    }

    // STAGE 3: CRITICAL CHECK - QR Permanently Invalid (Completed or Returned)
    // Once completed/returned, QR can NEVER be scanned again
    // No database updates for completed/expired QR codes
    console.log('[VERIFY] STAGE 3: Checking permanent invalidation...');
    const gpReleaseStatus = (gatePass as any).releaseStatus;
    const gpCompletedAt = (gatePass as any).completedAt;
    
    // Check ALL terminal states that make QR permanently invalid:
    // 1. releaseStatus === 'returned' (after processReturn)
    // 2. releaseStatus === 'completed' (legacy)
    // 3. request.status === 'completed' (final state)
    // 4. gatePass.isUsed && gateStatus === 'inside' (returned to premises)
    const qrInvalidStatuses = ['returned', 'completed'];
    const isPermanentlyInvalid = 
      (gatePass.isUsed && qrInvalidStatuses.includes(gpReleaseStatus)) ||
      request.status === 'completed' ||
      (gatePass.isUsed && (gatePass as any).gateStatus === 'inside');
    
    if (isPermanentlyInvalid) {
      console.log('[VERIFY] STAGE 3: ✗ QR permanently invalid - already completed');
      return {
        success: false,
        gatePass,
        request,
        verification,
        message: 'This Gate Pass has already been completed. QR code is permanently invalid.',
        code: 'ALREADY_COMPLETED',
      };
    }

    // STAGE 4: Check if already released - GATE IN MODE (return scan)
    console.log('[VERIFY] STAGE 4: Checking release status...');
    const isAlreadyReleased = verification.releaseStatus === 'released' || 
                              verification.status === 'released' ||
                              gpReleaseStatus === 'released';

    console.log('[VERIFY] STAGE 4: Verification releaseStatus:', verification.releaseStatus);
    console.log('[VERIFY] STAGE 4: Verification status:', verification.status);
    console.log('[VERIFY] STAGE 4: GatePass releaseStatus:', gpReleaseStatus);
    console.log('[VERIFY] STAGE 4: Is already released:', isAlreadyReleased);

    // STAGE 5: Check if expired - NO DATABASE UPDATE for expired
    console.log('[VERIFY] STAGE 5: Checking expiration...');
    if (verification.expiresAt && new Date() > verification.expiresAt) {
      console.log('[VERIFY] STAGE 5: ✗ QR Code expired');
      // DO NOT update database - read-only rejection for expired QR
      return {
        success: false,
        gatePass,
        request,
        verification,
        message: 'QR CODE EXPIRED - This QR code is no longer valid.',
        code: 'EXPIRED',
      };
    }
    console.log('[VERIFY] STAGE 5: ✓ Expiration check passed');

    // STAGE 6: Check if approved
    console.log('[VERIFY] STAGE 6: Checking approval status...');
    if (request.status !== 'approved') {
      console.log('[VERIFY] STAGE 6: ✗ Request not approved, status:', request.status);
      return {
        success: false,
        gatePass,
        request,
        verification,
        message: 'Gate pass is not approved',
        code: 'NOT_APPROVED',
      };
    }
    console.log('[VERIFY] STAGE 6: ✓ Approval validation passed');

    // STAGE 7: Update verification status ONLY for new scans (not completed QRs)
    console.log('[VERIFY] STAGE 7: Updating verification status...');
    if (!isAlreadyReleased) {
      try {
        await prisma.gatePassVerification.update({
          where: { id: verification.id },
          data: {
            scanCount: { increment: 1 },
            scannedAt: new Date(),
            status: 'verified',
            verificationStatus: 'verified',
          },
        });
        console.log('[VERIFY] STAGE 7: ✓ Verification status updated');
      } catch (error) {
        console.error('[VERIFY] STAGE 7: ✗ Failed to update verification status:', error);
        throw error;
      }
    } else {
      console.log('[VERIFY] STAGE 7: Return scan - no status update needed');
    }

    // STAGE 8: Build response with mode indicator
    console.log('[VERIFY] STAGE 8: Building response payload...');
    console.log('[VERIFY] STAGE 8: Mode:', isAlreadyReleased ? 'GATE IN' : 'GATE OUT');
    console.log('[VERIFY] ========== TOKEN VALIDATION SUCCESS ==========');

    const responseVerification = {
      ...verification,
      status: isAlreadyReleased ? verification.status : 'verified',
      verificationStatus: isAlreadyReleased ? verification.verificationStatus : 'verified',
      mode: isAlreadyReleased ? 'gate_in' : 'gate_out',
      isAlreadyReleased,
    } as any;

    return {
      success: true,
      gatePass: {
        ...gatePass,
        transportationAssignment:
          (gatePass as any).transportationAssignment,
        transportationMode:
          (gatePass as any).transportationAssignment
            ?.transportationType ||
          gatePass.transportation,
        vehiclePlate:
          (gatePass as any).transportationAssignment
            ?.vehiclePlate || gatePass.plateNumber,
        driverName:
          (gatePass as any).transportationAssignment
            ?.driverName || gatePass.driverName,
      },
      request,
      verification: responseVerification,
      message: isAlreadyReleased
        ? 'Employee returning. Please complete the Gate In form.'
        : 'QR code validated successfully. Please complete the Security Release Form.',
    };
  }

  /**
   * Release gate pass (GATE OUT) - called when security confirms exit
   * This implements the complete Gate Out workflow
   */
  async releaseGatePass(
    token: string,
    securityUserId: string,
    securityUserName: string,
    data: {
      kmReadingStart: number;
      kmReadingEnd?: number;
      plateNumber?: string;
      driverName?: string;
      driverIn?: string;
      timeOut: Date;
      timeIn?: Date;
      remarks?: string;
      ipAddress?: string;
      device?: string;
      browser?: string;
    }
  ): Promise<VerificationResult> {
    console.log('[RELEASE] ========== START GATE OUT PROCESS ==========');
    console.log('[RELEASE] Token received:', token.substring(0, 8) + '...');

    const verification = await prisma.gatePassVerification.findUnique({
      where: { verificationToken: token },
      include: {
        gatePass: {
          include: {
            request: {
              include: {
                requester: { select: { id: true, displayName: true } },
                department: { select: { id: true, name: true, code: true } },
              },
            },
          },
        },
      },
    });

    if (!verification || !verification.gatePass) {
      console.error('[RELEASE] Verification not found');
      throw new NotFoundError('Invalid verification token');
    }

    const gatePass = verification.gatePass;
    const request = gatePass.request;

    // Check if already released
    const vReleaseStatus = (verification as any).releaseStatus;
    const gpReleaseStatus = (gatePass as any).releaseStatus;
    if (vReleaseStatus === 'released' || gpReleaseStatus === 'released') {
      console.log('[RELEASE] Already released');
      return {
        success: false,
        gatePass: {
          ...gatePass,
          transportationMode: (gatePass as any).transportationMode,
          vehiclePlate: (gatePass as any).vehiclePlate,
          driverName: (gatePass as any).driverName,
        },
        request: {
          ...request,
          department: (request as any).department,
        },
        verification: {
          ...verification,
          releasedBy: securityUserName,
        },
        message: 'This Gate Pass has already been released by Security.',
        code: 'ALREADY_RELEASED',
      };
    }

    if (request.status !== 'approved') {
      throw new ValidationError('Gate pass must be approved before release');
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
          releaseStatus: 'released',
          releasedAt: data.timeOut,
          releasedBy: securityUserId,
          guardEmployeeId: guardEmployee?.id,
          guardIPAddress: data.ipAddress,
          guardDevice: data.device,
          guardBrowser: data.browser,
          remarks: data.remarks,
          kmReadingStart: data.kmReadingStart,
          kmReadingEnd: data.kmReadingEnd,
          vehiclePlate: data.plateNumber,
          driverName: data.driverName,
          timeOut: data.timeOut,
        },
      });

      // Update gate pass
      const updatedGatePass = await tx.gatePass.update({
        where: { requestId: gatePass.requestId },
        data: {
          securityReleasedBy: securityUserId,  // User ID for PDF lookup
          securityReleasedAt: data.timeOut,
          releasedAt: data.timeOut,
          releasedDate: new Date(data.timeOut.toDateString()),
          releasedTime: data.timeOut,
          releasedBy: securityUserName,  // Display name for immediate use
          isUsed: true,
          isVerified: true,
          verifiedAt: data.timeOut,
          verifiedBy: securityUserId,
          printCount: { increment: 1 },
          kmReadingStart: data.kmReadingStart,
          kmReadingEnd: data.kmReadingEnd,
          plateNumber: data.plateNumber,
          driverNameSecurity: data.driverName,
          timeOut: data.timeOut,
          securityRemarks: data.remarks,
          releaseStatus: 'released',
          gateStatus: 'outside',
        },
      });

      // Update request status to approved (not completed yet - waiting for return)
      const updatedRequest = await tx.approvalRequest.update({
        where: { id: request.id },
        data: {
          status: 'approved', // Keep as approved until return
          completedAt: null,
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
            plateNumber: data.plateNumber,
            driverName: data.driverName,
            guardName: securityUserName,
            guardEmployeeNumber: guardEmployee?.employeeNumber,
            ipAddress: data.ipAddress,
            device: data.device,
            browser: data.browser,
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
          plateNumber: data.plateNumber,
          driverName: data.driverName,
          releasedAt: data.timeOut,
          guardName: securityUserName,
          guardEmployeeNumber: guardEmployee?.employeeNumber,
          ipAddress: data.ipAddress,
          device: data.device,
          browser: data.browser,
        },
      });

      return { verification: updatedVerification, gatePass: updatedGatePass, request: updatedRequest };
    });

    // Create timeline event
    await gatePassTimelineService.createEvent({
      gatePassId: gatePass.id,
      eventType: 'released',
      actorId: securityUserId,
      actorName: securityUserName,
      description: `Employee released - KM Out: ${data.kmReadingStart}`,
      metadata: {
        controlNumber: request.controlNumber,
        kmReadingStart: data.kmReadingStart,
        kmReadingEnd: data.kmReadingEnd,
        plateNumber: data.plateNumber,
        driverName: data.driverName,
        timeOut: data.timeOut.toISOString(),
        guardName: securityUserName,
        guardEmployeeNumber: guardEmployee?.employeeNumber,
        ipAddress: data.ipAddress,
        device: data.device,
        browser: data.browser,
      },
    });

    // Notify requester
    await notificationService.notifyUser(request.requesterId, {
      title: 'Gate Pass Released',
      message: `Your gate pass ${request.controlNumber} has been released by Security. Please return by ${gatePass.expectedReturn?.toLocaleString()}`,
      actionUrl: '/app/m/gate-pass',
      requestId: request.id,
      controlNumber: request.controlNumber,
      metadata: { moduleId: 'gate-pass', status: 'released' },
    });

    console.log('[RELEASE] ========== GATE OUT PROCESS COMPLETED ==========');

    return {
      success: true,
      gatePass: {
        ...result.gatePass,
        transportationMode: (gatePass as any).transportationMode,
        vehiclePlate: (gatePass as any).vehiclePlate,
        driverName: (gatePass as any).driverName,
      },
      request: {
        ...result.request,
        department: (request as any).department,
      },
      verification: {
        ...result.verification,
        releasedBy: securityUserName,
        mode: 'gate_out',
      },
      message: 'Gate pass released successfully',
      code: 'RELEASE_COMPLETED',
    };
  }

  /**
   * Process employee return (GATE IN) - called when security scans QR on return
   * This implements the complete return workflow with OB meal logic
   */
  async processReturn(
    token: string,
    securityUserId: string,
    securityUserName: string,
    data: {
      kmReadingEnd: number;
      returnRemarks?: string;
      obMealEnabled?: boolean;
      obMealAmount?: number;
      ipAddress?: string;
      device?: string;
      browser?: string;
    }
  ): Promise<VerificationResult> {
    console.log('[RETURN] ========== START GATE IN PROCESS ==========');
    console.log('[RETURN] Token received:', token.substring(0, 8) + '...');

    // STAGE 1: Find verification record
    const verification = await prisma.gatePassVerification.findUnique({
      where: { verificationToken: token },
      include: {
        gatePass: {
          include: {
            request: {
              include: {
                requester: { select: { id: true, displayName: true } },
                department: { select: { id: true, name: true, code: true } },
              },
            },
          },
        },
      },
    });

    if (!verification || !verification.gatePass) {
      console.error('[RETURN] Verification not found');
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
    const request = gatePass.request;

    // STAGE 2: Validate return conditions
    console.log('[RETURN] STAGE 2: Validating return conditions...');
    
    // Must be released to process return
    const vReleaseStatus2 = (verification as any).releaseStatus;
    const gpReleaseStatus2 = (gatePass as any).releaseStatus;
    const isReleased = vReleaseStatus2 === 'released' || 
                       verification.status === 'released' ||
                       gpReleaseStatus2 === 'released';

    if (!isReleased) {
      console.log('[RETURN] STAGE 2: ✗ Not in released status');
      return {
        success: false,
        gatePass,
        request,
        verification,
        message: 'Gate pass has not been released yet. Cannot process return.',
        code: 'NOT_RELEASED',
      };
    }

    // Check if already returned
    if (vReleaseStatus2 === 'returned' || gpReleaseStatus2 === 'returned') {
      console.log('[RETURN] STAGE 2: ✗ Already returned');
      return {
        success: false,
        gatePass: gatePass as any,
        request: request as any,
        verification: verification as any,
        message: 'Gate pass has already been returned.',
        code: 'ALREADY_RETURNED',
      };
    }

    console.log('[RETURN] STAGE 2: ✓ Return validation passed');

    // STAGE 3: Calculate trip duration and business rules
    console.log('[RETURN] STAGE 3: Calculating trip duration and business rules...');
    const vTimeOut = (verification as any).timeOut || (gatePass as any).timeOut;
    const timeIn = new Date();
    const tripDurationMs = vTimeOut ? (timeIn.getTime() - new Date(vTimeOut).getTime()) : 0;
    const tripDurationHours = tripDurationMs / (1000 * 60 * 60);
    const tripDurationMinutes = Math.floor(tripDurationMs / (1000 * 60));

    console.log('[RETURN] Time Out:', vTimeOut?.toISOString());
    console.log('[RETURN] Time In:', timeIn.toISOString());
    console.log('[RETURN] Trip Duration (hours):', tripDurationHours.toFixed(2));
    console.log('[RETURN] Trip Duration (minutes):', tripDurationMinutes);

    // Business Rule: Check if destination is outside CALABARZON
    // CALABARZON = Cavite, Laguna, Batangas, Rizal, Quezon
    const calabarzonProvinces = ['cavite', 'laguna', 'batangas', 'rizal', 'quezon'];
    const destination = (gatePass.destination || '').toLowerCase();
    const isOutsideCalabarzon = !calabarzonProvinces.some(province => destination.includes(province));

    console.log('[RETURN] Destination:', gatePass.destination);
    console.log('[RETURN] Is outside CALABARZON:', isOutsideCalabarzon);

    // Business Rule: OB Meal Eligibility
    // Condition 1: Destination outside CALABARZON
    // Condition 2: Trip duration >= 4 hours (configurable)
    const obMealThresholdHours = parseFloat(process.env.OB_MEAL_THRESHOLD_HOURS || '4');
    const isEligibleForOBMeal = isOutsideCalabarzon && tripDurationHours >= obMealThresholdHours;

    console.log('[RETURN] OB Meal Threshold:', obMealThresholdHours, 'hours');
    console.log('[RETURN] Is eligible for OB Meal:', isEligibleForOBMeal);

    // Use provided OB meal data or calculate eligibility
    const finalObMealEnabled = data.obMealEnabled || isEligibleForOBMeal;
    const finalObMealAmount = data.obMealAmount || parseFloat(process.env.OB_MEAL_DEFAULT_AMOUNT || '500');

    console.log('[RETURN] Final OB Meal Enabled:', finalObMealEnabled);
    console.log('[RETURN] Final OB Meal Amount:', finalObMealAmount);

    // STAGE 4: Validate KM reading
    console.log('[RETURN] STAGE 4: Validating KM reading...');
    const vKmStart = (verification as any).kmReadingStart || (gatePass as any).kmReadingStart;
    if (data.kmReadingEnd < (vKmStart || 0)) {
      console.error('[RETURN] STAGE 4: ✗ KM In cannot be lower than KM Out');
      return {
        success: false,
        gatePass,
        request,
        verification,
        message: `KM Reading In (${data.kmReadingEnd}) cannot be lower than KM Reading Out (${vKmStart})`,
        code: 'INVALID_KM_READING',
      };
    }
    console.log('[RETURN] STAGE 4: ✓ KM validation passed');

    // STAGE 5: Update database in transaction
    console.log('[RETURN] STAGE 5: Updating database...');
    const result = await prisma.$transaction(async (tx) => {
      // Update verification record
      const updatedVerification = await tx.gatePassVerification.update({
        where: { id: verification.id },
        data: {
          timeIn,
          kmReadingEnd: data.kmReadingEnd,
          returnRemarks: data.returnRemarks,
          releaseStatus: 'returned',
          verificationStatus: 'verified',
          obMealEligible: finalObMealEnabled,
          tripDurationMinutes,
          guardIPAddress: data.ipAddress,
          guardDevice: data.device,
          guardBrowser: data.browser,
        },
      });

      // Update gate pass - Set releaseStatus to 'returned' for history tracking
      // but also effectively marks as completed. GatePassTimeline 'completed' event
      // ensures QR is invalidated on all subsequent scans.
      const updatedGatePass = await tx.gatePass.update({
        where: { requestId: gatePass.requestId },
        data: {
          timeIn,
          kmReadingEnd: data.kmReadingEnd,
          tripDuration: tripDurationHours,
          tripDurationMinutes,
          releaseStatus: 'returned',
          completedAt: timeIn,
          returnedBy: securityUserName,
          returnedAt: timeIn,
          returnRemarks: data.returnRemarks,
          obMealEnabled: finalObMealEnabled,
          obMealEligible: finalObMealEnabled,
          obMealAmount: finalObMealEnabled ? finalObMealAmount : 0,
          gateStatus: 'inside',
          isUsed: true,
        } as any,
      });

      // Update request status to completed
      const updatedRequest = await tx.approvalRequest.update({
        where: { id: request.id },
        data: {
          status: 'completed',
          completedAt: timeIn,
        },
      });

      // Create approval action for return
      await tx.approvalAction.create({
        data: {
          requestId: request.id,
          action: 'return',
          actorId: securityUserId,
          note: data.returnRemarks,
          metadata: {
            returnedAt: timeIn,
            tripDurationHours,
            tripDurationMinutes,
            kmReadingEnd: data.kmReadingEnd,
            obMealEnabled: finalObMealEnabled,
            obMealAmount: finalObMealAmount,
            isOutsideCalabarzon,
            guardName: securityUserName,
            ipAddress: data.ipAddress,
            device: data.device,
            browser: data.browser,
          },
        },
      });

      // Create audit log
      await auditService.record('return', 'gate_pass', {
        actorId: securityUserId,
        entityId: gatePass.id,
        targetId: request.id,
        metadata: {
          controlNumber: request.controlNumber,
          token: token.substring(0, 8) + '...',
          timeOut: vTimeOut?.toISOString(),
          timeIn: timeIn.toISOString(),
          tripDurationHours,
          tripDurationMinutes,
          kmReadingEnd: data.kmReadingEnd,
          obMealEnabled: finalObMealEnabled,
          obMealAmount: finalObMealAmount,
          isOutsideCalabarzon,
          guardName: securityUserName,
          ipAddress: data.ipAddress,
          device: data.device,
          browser: data.browser,
        },
      });

      return { verification: updatedVerification, gatePass: updatedGatePass, request: updatedRequest };
    });

    // STAGE 6: Create timeline event
    console.log('[RETURN] STAGE 6: Creating timeline event...');
    await gatePassTimelineService.createEvent({
      gatePassId: gatePass.id,
      eventType: 'completed',
      actorId: securityUserId,
      actorName: securityUserName,
      description: `Employee returned - Trip duration: ${tripDurationHours.toFixed(2)} hours (${tripDurationMinutes} minutes)`,
      metadata: {
        controlNumber: request.controlNumber,
        timeOut: vTimeOut?.toISOString(),
        timeIn: timeIn.toISOString(),
        tripDurationHours,
        tripDurationMinutes,
        kmReadingEnd: data.kmReadingEnd,
        obMealEnabled: finalObMealEnabled,
        obMealAmount: finalObMealAmount,
        isOutsideCalabarzon,
        ipAddress: data.ipAddress,
        device: data.device,
        browser: data.browser,
      },
    });

    // STAGE 7: Send notifications
    console.log('[RETURN] STAGE 7: Sending notifications...');
    await notificationService.notifyUser(request.requesterId, {
      title: 'Gate Pass Returned',
      message: `Your gate pass ${request.controlNumber} has been returned successfully. Trip duration: ${tripDurationHours.toFixed(2)} hours`,
      actionUrl: '/app/m/gate-pass',
      requestId: request.id,
      controlNumber: request.controlNumber,
      metadata: {
        moduleId: 'gate-pass',
        status: 'completed',
        tripDurationHours,
        obMealEnabled: finalObMealEnabled,
      },
    });

    // Notify supervisor
    const supervisorStep = await prisma.approvalStep.findFirst({
      where: {
        requestId: request.id,
        name: { contains: 'recommend' },
      },
    });

    if (supervisorStep?.actorId) {
      await notificationService.notifyUser(supervisorStep.actorId, {
        title: 'Gate Pass Successfully Completed',
        message: `Employee ${request.requester.displayName} has returned with gate pass ${request.controlNumber}. Trip duration: ${tripDurationHours.toFixed(2)} hours`,
        actionUrl: '/app/m/gate-pass',
        requestId: request.id,
        controlNumber: request.controlNumber,
        metadata: { moduleId: 'gate-pass', status: 'completed' },
      });
    }

    // Notify admin
    const adminStep = await prisma.approvalStep.findFirst({
      where: {
        requestId: request.id,
        name: { contains: 'admin' },
      },
    });

    if (adminStep?.actorId) {
      await notificationService.notifyUser(adminStep.actorId, {
        title: 'Gate Pass Successfully Completed',
        message: `Gate pass ${request.controlNumber} has been returned by security. Trip duration: ${tripDurationHours.toFixed(2)} hours`,
        actionUrl: '/app/m/gate-pass',
        requestId: request.id,
        controlNumber: request.controlNumber,
        metadata: { moduleId: 'gate-pass', status: 'completed' },
      });
    }

    // Notify HR if OB Meal exists
    if (finalObMealEnabled && finalObMealAmount > 0) {
      const hrRole = await prisma.role.findFirst({
        where: { 
          OR: [
            { name: { contains: 'hr' } },
            { name: { contains: 'human' } }
          ], 
          isActive: true 
        },
      });

      if (hrRole) {
        const hrUsers = await prisma.userRole.findMany({
          where: { roleId: hrRole.id },
          include: { user: { select: { id: true } } },
        });

        for (const userRole of hrUsers) {
          await notificationService.notifyUser(userRole.user.id, {
            title: 'OB Meal Allowance Required',
            message: `Gate pass ${request.controlNumber} requires OB Meal Allowance of ₱${finalObMealAmount.toFixed(2)}. Trip duration: ${tripDurationHours.toFixed(2)} hours`,
            actionUrl: '/app/m/gate-pass',
            requestId: request.id,
            controlNumber: request.controlNumber,
            metadata: { 
              moduleId: 'gate-pass', 
              status: 'ob_meal_required',
              obMealAmount: finalObMealAmount,
              tripDurationHours 
            },
          });
        }
      }
    }

    console.log('[RETURN] ========== GATE IN PROCESS COMPLETED ==========');

    return {
      success: true,
      gatePass: {
        ...result.gatePass,
        transportationMode: (gatePass as any).transportationMode,
        vehiclePlate: (gatePass as any).vehiclePlate,
        driverName: (gatePass as any).driverName,
      },
      request: {
        ...result.request,
        department: (request as any).department,
      },
      verification: {
        ...result.verification,
        releasedBy: securityUserName,
        mode: 'gate_in',
      },
      message: `Return processed successfully. Trip duration: ${tripDurationHours.toFixed(2)} hours (${tripDurationMinutes} minutes)`,
      code: 'RETURN_COMPLETED',
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
      controlNumber: '',
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