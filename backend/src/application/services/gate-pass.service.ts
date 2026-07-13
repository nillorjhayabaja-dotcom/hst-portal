import { gatePassRepository } from '../../infrastructure/database/repositories/gate-pass.repository';
import { auditService } from '../../infrastructure/audit/audit.service';
import { notificationService } from '../../infrastructure/notifications/notification.service';
import { fileStorageService } from '../../infrastructure/storage/file-storage.service';
import { prisma } from '../../infrastructure/database/prisma.service';
import { NotFoundError, ValidationError, ApprovalSignatureRequiredError, InvalidSignatureFormatError, SignatureTooLargeError, SignatureUploadFailedError } from '../../shared/errors';
import { workflowEngine } from '../../infrastructure/workflow/workflow-engine.service';
import { GatePassWorkflowService } from './gate-pass-workflow.service';

export interface GatePassFilters {
  status?: string;
  requesterId?: string;
  departmentId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  currentUserId?: string;
  userRoles?: string[];
  userDepartmentId?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

const gatePassWorkflowService = new GatePassWorkflowService();

export class GatePassService {
  async getAll(filters: GatePassFilters = {}): Promise<PaginatedResult<any>> {
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const result = await gatePassRepository.list({
      skip,
      take: pageSize,
      status: filters.status,
      requesterId: filters.requesterId,
      departmentId: filters.departmentId,
      search: filters.search,
      startDate: filters.startDate,
      endDate: filters.endDate,
      currentUserId: filters.currentUserId,
      userRoles: filters.userRoles,
      userDepartmentId: filters.userDepartmentId,
    });

    return {
      items: result.items,
      total: result.total,
      page,
      pageSize,
    };
  }

  async submit(data: {
    purpose: string;
    destination?: string;
    transportation?: string;
    plateNumber?: string;
    vehicleId?: string;
    driverName?: string;
    items?: any;
    expectedReturn?: Date;
    notes?: string;
    requesterId: string;
    departmentId?: string;
  }) {
    console.log('[SUBMIT] Starting gate pass submission for user:', data.requesterId);
    console.log('[SUBMIT] Data:', JSON.stringify({ ...data, requesterId: data.requesterId }));
    
    let resolvedVehicleId: string | undefined = data.vehicleId;
    let resolvedPlateNumber: string | undefined;

    if (data.plateNumber) {
      const vehicle = await gatePassRepository.getVehicleByPlateNumber(data.plateNumber);
      if (vehicle) {
        resolvedVehicleId = vehicle.id;
      } else {
        // Plate number entered doesn't match a registered vehicle.
        // Store it as a free-text value on the gate pass instead of linking to a vehicle FK.
        console.warn(`[SUBMIT] Vehicle plate number not found in system: ${data.plateNumber}. Storing as text.`);
        resolvedPlateNumber = data.plateNumber;
      }
    }

    const started = await workflowEngine.startRequest({
      moduleId: 'gate-pass',
      title: data.purpose,
      description: data.notes || data.purpose,
      requesterId: data.requesterId,
      departmentId: data.departmentId,
      metadata: { purpose: data.purpose, destination: data.destination },
    });

    const gatePass = await gatePassRepository.create({
      requestId: started.id,
      purpose: data.purpose,
      transportation: data.transportation,
      vehicleId: resolvedVehicleId,
      plateNumber: resolvedPlateNumber,
      driverName: data.driverName,
      items: data.items,
      destination: data.destination,
      expectedReturn: data.expectedReturn,
    });

    await auditService.record('create', 'gate_pass', {
      actorId: data.requesterId,
      entityId: gatePass.id,
      metadata: { controlNumber: started.controlNumber },
    });

    return {
      id: gatePass.id,
      requestId: started.id,
      controlNumber: started.controlNumber,
      status: started.status,
    };
  }

  async getById(id: string) {
    const gatePass = await gatePassRepository.findById(id);
    if (!gatePass) {
      throw new NotFoundError('Gate pass not found');
    }
    return gatePass;
  }

  async getByRequestId(requestId: string) {
    const gatePass = await gatePassRepository.findByRequestId(requestId);
    if (!gatePass) {
      throw new NotFoundError('Gate pass not found');
    }
    return gatePass;
  }

  async create(data: {
    requestId: string;
    purpose: string;
    transportation?: string;
    vehicleId?: string;
    driverName?: string;
    items?: any;
    destination?: string;
    expectedReturn?: Date;
    requesterId: string;
    departmentId?: string;
    controlNumber?: string;
  }) {
    const gatePass = await gatePassRepository.create({
      requestId: data.requestId,
      purpose: data.purpose,
      transportation: data.transportation,
      vehicleId: data.vehicleId,
      driverName: data.driverName,
      items: data.items,
      destination: data.destination,
      expectedReturn: data.expectedReturn,
    });

    await auditService.record('create', 'gate_pass', {
      actorId: data.requesterId,
      entityId: gatePass.id,
      metadata: { controlNumber: data.controlNumber },
    });

    return gatePass;
  }

  async update(
    id: string,
    data: {
      purpose?: string;
      transportation?: string;
      vehicleId?: string;
      driverName?: string;
      items?: any;
      destination?: string;
      expectedReturn?: Date;
      actualReturn?: Date;
      qrCode?: string;
      securityReleasedBy?: string;
      securityReleasedAt?: Date;
      printCount?: number;
    },
    actorId?: string
  ) {
    const gatePass = await gatePassRepository.findById(id);
    if (!gatePass) {
      throw new NotFoundError('Gate pass not found');
    }

    const updated = await gatePassRepository.update(id, data);

    if (actorId) {
      await auditService.record('update', 'gate_pass', {
        actorId,
        entityId: id,
        changes: data,
      });
    }

    return updated;
  }

  async updateByRequestId(requestId: string, data: any, actorId?: string) {
    const gatePass = await gatePassRepository.findByRequestId(requestId);
    if (!gatePass) {
      throw new NotFoundError('Gate pass not found');
    }

    const updated = await gatePassRepository.updateByRequestId(requestId, data);

    if (actorId) {
      await auditService.record('update', 'gate_pass', {
        actorId,
        entityId: gatePass.id,
        changes: data,
      });
    }

    return updated;
  }

  async getStats(filters: { startDate?: string; endDate?: string; departmentId?: string } = {}) {
    return gatePassRepository.getStats(filters);
  }

  async getActiveGatePasses() {
    return gatePassRepository.getActiveGatePasses();
  }

  async approve(requestId: string, actorId: string, actorName: string, note?: string, signature?: { originalname: string; mimetype: string; size: number; stream: any }) {
    const result = await gatePassWorkflowService.approveStep(
      requestId,
      actorId,
      actorName,
      'approve',
      note,
      signature
    );

    if (!result.success) {
      throw new ValidationError(result.message);
    }

    const gatePass = await gatePassRepository.findByRequestId(requestId);
    return gatePass!;
  }

  async reject(requestId: string, actorId: string, actorName: string, reason: string) {
    const result = await gatePassWorkflowService.rejectStep(
      requestId,
      actorId,
      actorName,
      reason
    );

    if (!result.success) {
      throw new ValidationError(result.message);
    }
  }

  async returnRequest(requestId: string, actorId: string, actorName: string, note: string) {
    const result = await gatePassWorkflowService.returnStep(
      requestId,
      actorId,
      actorName,
      note
    );

    if (!result.success) {
      throw new ValidationError(result.message);
    }
  }

  async recordSecurityCheck(
    requestId: string,
    data: {
      kmReadingStart?: number;
      timeOut?: Date;
      kmReadingEnd?: number;
      timeIn?: Date;
      checkedBy: string;
      withMeal?: boolean;
      mealAmount?: number;
    }
  ) {
    const gatePass = await gatePassRepository.findByRequestId(requestId);
    if (!gatePass) {
      throw new NotFoundError('Gate pass not found');
    }

    const updated = await gatePassRepository.updateByRequestId(requestId, {
      securityReleasedBy: data.checkedBy,
      securityReleasedAt: data.timeOut,
      printCount: (gatePass.printCount || 0) + 1,
    });

    await auditService.record('update', 'gate_pass', {
      actorId: data.checkedBy,
      entityId: gatePass.id,
      metadata: { action: 'security_check', data },
    });

    return updated;
  }

  async generateQRCode(requestId: string): Promise<string> {
    const gatePass = await gatePassRepository.findByRequestId(requestId);
    if (!gatePass) {
      throw new NotFoundError('Gate pass not found');
    }

    if (gatePass.request.status !== 'approved') {
      throw new ValidationError('QR code can only be generated for approved gate passes');
    }

    const qrData = {
      controlNumber: gatePass.request.controlNumber,
      requestId,
      purpose: gatePass.purpose,
      destination: gatePass.destination,
      expectedReturn: gatePass.expectedReturn,
      timestamp: new Date().toISOString(),
    };

    const qrCode = Buffer.from(JSON.stringify(qrData)).toString('base64');

    await gatePassRepository.updateByRequestId(requestId, {
      qrCode,
      printCount: (gatePass.printCount || 0) + 1,
    });

    await auditService.record('generate_qr', 'gate_pass', {
      actorId: gatePass.request.requesterId,
      entityId: gatePass.id,
      metadata: { qrCode },
    });

    return qrCode;
  }

  async getWorkflowStatus(requestId: string) {
    return gatePassWorkflowService.getWorkflowStatus(requestId);
  }

  async uploadSignature(userId: string, signature: { originalname: string; mimetype: string; size: number; stream: any }) {
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedMimeTypes.includes(signature.mimetype)) {
      throw new InvalidSignatureFormatError();
    }

    const maxSize = 2 * 1024 * 1024;
    if (signature.size > maxSize) {
      throw new SignatureTooLargeError();
    }

    try {
      const uploadedFile = await fileStorageService.upload(
        signature,
        'signatures',
        userId,
        userId,  // uploadedBy must be a valid user UUID
      );

      await prisma.user.update({
        where: { id: userId },
        data: {
          signaturePath: uploadedFile.storagePath,
          signatureUploadedAt: new Date(),
          signatureMimeType: signature.mimetype,
        },
      });

      await auditService.record('upload_signature', 'user', {
        actorId: userId,
        entityId: userId,
        metadata: { signaturePath: uploadedFile.storagePath },
      });

      return {
        signaturePath: uploadedFile.storagePath,
        mimeType: signature.mimetype,
      };
    } catch (error) {
      throw new SignatureUploadFailedError(error instanceof Error ? error.message : 'Failed to upload signature');
    }
  }

  async getUserSignature(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    return {
      signaturePath: user.signaturePath,
      signatureUploadedAt: user.signatureUploadedAt,
      signatureMimeType: user.signatureMimeType,
    };
  }

  async approveStep(
    requestId: string,
    actorId: string,
    actorName: string,
    stepName: string,
    note?: string,
    signature?: { originalname: string; mimetype: string; size: number; stream: any }
  ) {
    const result = await gatePassWorkflowService.approveStep(
      requestId,
      actorId,
      actorName,
      stepName,
      note,
      signature
    );

    if (!result.success) {
      throw new ValidationError(result.message);
    }

    const gatePass = await gatePassRepository.findByRequestId(requestId);
    return gatePass;
  }

  async releaseGatePass(
    requestId: string,
    securityUserId: string,
    securityName: string,
    data: {
      kmReadingStart?: number;
      kmReadingEnd?: number;
      withMeal?: boolean;
      mealAmount?: number;
      timeOut: Date;
      timeIn?: Date;
    }
  ) {
    const gatePass = await gatePassRepository.findByRequestId(requestId);
    if (!gatePass) {
      throw new NotFoundError('Gate pass not found');
    }

    const request = await prisma.approvalRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.status !== 'approved') {
      throw new ValidationError('Gate pass must be fully approved before release');
    }

    if (gatePass.securityReleasedAt) {
      throw new ValidationError('Gate pass has already been released');
    }

    // Update gate pass with release info
    const updated = await gatePassRepository.updateByRequestId(requestId, {
      securityReleasedBy: securityUserId,
      securityReleasedAt: data.timeOut,
      printCount: (gatePass.printCount || 0) + 1,
    });

    // Update request status to released
    await prisma.approvalRequest.update({
      where: { id: requestId },
      data: { status: 'released' },
    });

    // Audit log
    await auditService.record('release', 'gate_pass', {
      actorId: securityUserId,
      entityId: gatePass.id,
      metadata: {
        controlNumber: request.controlNumber,
        kmReadingStart: data.kmReadingStart,
        kmReadingEnd: data.kmReadingEnd,
        withMeal: data.withMeal,
        mealAmount: data.mealAmount,
        releasedAt: data.timeOut,
      },
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

    return updated;
  }

  async incrementPrintCount(requestId: string) {
    const gatePass = await gatePassRepository.findByRequestId(requestId);
    if (!gatePass) {
      throw new NotFoundError('Gate pass not found');
    }

    const updated = await gatePassRepository.updateByRequestId(requestId, {
      printCount: (gatePass.printCount || 0) + 1,
    });

    return updated;
  }
}
