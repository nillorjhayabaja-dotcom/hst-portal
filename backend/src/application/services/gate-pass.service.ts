import { PrismaClient } from '@prisma/client';
import { approvalService } from './approval.service';
import { notificationService } from '../../infrastructure/notifications/notification.service';
import { auditService } from '../../infrastructure/audit/audit.service';

const prisma = new PrismaClient();

export interface GatePassFilters {
  status?: string;
  requesterId?: string;
  departmentId?: string;
  vehicleId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const gatePassService = {
  async getAll(
    filters: GatePassFilters = {},
    page = 1,
    pageSize = 20,
  ): Promise<PaginatedResult<any>> {
    const skip = (page - 1) * pageSize;
    const where: any = {};

    if (filters.status) where.request = { ...where.request, status: filters.status };
    if (filters.requesterId) where.request = { ...where.request, requesterId: filters.requesterId };
    if (filters.departmentId)
      where.request = { ...where.request, departmentId: filters.departmentId };
    if (filters.vehicleId) where.vehicleId = filters.vehicleId;
    if (filters.search) {
      where.request = {
        ...where.request,
        OR: [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { controlNumber: { contains: filters.search, mode: 'insensitive' } },
        ],
      };
    }

    const [items, total] = await Promise.all([
      prisma.gatePass.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          request: {
            include: {
              requester: { select: { id: true, employeeId: true, displayName: true } },
              department: { select: { id: true, name: true, code: true } },
              steps: { include: { role: true, actor: { select: { displayName: true } } } },
            },
          },
          vehicle: { select: { id: true, plateNumber: true, brand: true, model: true } },
        },
      }),
      prisma.gatePass.count({ where }),
    ]);

    return { items, total, page, pageSize };
  },

  async getById(id: string) {
    const gatePass = await prisma.gatePass.findUnique({
      where: { id },
      include: {
        request: {
          include: {
            requester: { select: { id: true, employeeId: true, displayName: true, email: true } },
            department: { select: { id: true, name: true, code: true } },
            workflow: { include: { steps: { orderBy: { stepOrder: 'asc' } } } },
            steps: {
              orderBy: { stepOrder: 'asc' },
              include: {
                role: true,
                actor: { select: { id: true, employeeId: true, displayName: true } },
              },
            },
            actions: {
              orderBy: { createdAt: 'desc' },
              include: { actor: { select: { displayName: true } } },
            },
          },
        },
        vehicle: true,
      },
    });

    if (!gatePass) throw new Error('Gate pass not found');
    return gatePass;
  },

  async create(data: {
    requesterId: string;
    departmentId?: string;
    purpose: string;
    transportation?: string;
    vehicleId?: string;
    driverName?: string;
    items?: any[];
    destination?: string;
    expectedReturn?: string;
    priority?: string;
    workflowId?: string;
  }) {
    // Generate control number
    const controlNumber = await this.generateControlNumber('gate-pass');

    // Create approval request and gate pass in transaction
    const result = await prisma.$transaction(async (tx: any) => {
      const approvalRequest = await tx.approvalRequest.create({
        data: {
          controlNumber,
          moduleId: 'gate-pass',
          title: `Gate Pass - ${data.purpose.substring(0, 50)}`,
          description: data.purpose,
          requesterId: data.requesterId,
          departmentId: data.departmentId,
          priority: data.priority || 'normal',
          status: 'draft',
          workflowId: data.workflowId,
          metadata: { transportation: data.transportation, destination: data.destination },
        },
      });

      const gatePass = await tx.gatePass.create({
        data: {
          requestId: approvalRequest.id,
          purpose: data.purpose,
          transportation: data.transportation,
          vehicleId: data.vehicleId,
          driverName: data.driverName,
          items: data.items || [],
          destination: data.destination,
          expectedReturn: data.expectedReturn ? new Date(data.expectedReturn) : null,
        },
        include: {
          request: {
            include: { requester: { select: { id: true, employeeId: true, displayName: true } } },
          },
          vehicle: true,
        },
      });

      return gatePass;
    });

    await auditService.record('create', 'gate-pass', {
      actorId: data.requesterId,
      entityId: result.id,
      metadata: { controlNumber },
    });

    return result;
  },

  async submit(id: string, userId: string) {
    const gatePass = await prisma.gatePass.findUnique({
      where: { id },
      include: { request: true },
    });

    if (!gatePass) throw new Error('Gate pass not found');
    if (gatePass.request.status !== 'draft')
      throw new Error('Only draft gate passes can be submitted');

    // Initialize workflow approval steps
    await approvalService.startWorkflow(gatePass.requestId, userId);

    const updated = await prisma.approvalRequest.update({
      where: { id: gatePass.requestId },
      data: { status: 'pending', submittedAt: new Date() },
    });

    await auditService.record('submit', 'gate-pass', {
      actorId: userId,
      entityId: id,
      metadata: { controlNumber: updated.controlNumber },
    });

    return this.getById(id);
  },

  async approve(id: string, userId: string, note?: string) {
    const gatePass = await prisma.gatePass.findUnique({
      where: { id },
      include: { request: { include: { steps: true } } },
    });
    if (!gatePass) throw new Error('Gate pass not found');

    const result = await approvalService.approve(gatePass.requestId, userId, note);

    // Generate QR code if fully approved
    if (result.status === 'approved') {
      const qrData = `${gatePass.request.controlNumber}|${id}`;
      await prisma.gatePass.update({
        where: { id },
        data: { qrCode: qrData },
      });
    }

    await notificationService.dispatch({
      moduleId: 'gate-pass',
      event: result.status === 'approved' ? 'approved' : 'in_review',
      title: `Gate Pass ${gatePass.request.controlNumber} ${result.status === 'approved' ? 'Approved' : 'Advanced'}`,
      message: `Your gate pass has been ${result.status === 'approved' ? 'approved' : 'reviewed'}`,
      requestId: gatePass.requestId,
      controlNumber: gatePass.request.controlNumber,
      actionUrl: `/app/gate-pass/${id}`,
      metadata: { moduleId: 'gate-pass' },
    });

    return this.getById(id);
  },

  async reject(id: string, userId: string, note?: string) {
    const gatePass = await prisma.gatePass.findUnique({
      where: { id },
      include: { request: true },
    });
    if (!gatePass) throw new Error('Gate pass not found');

    await approvalService.reject(gatePass.requestId, userId, note);

    await notificationService.dispatch({
      moduleId: 'gate-pass',
      event: 'rejected',
      title: `Gate Pass ${gatePass.request.controlNumber} Rejected`,
      message: note || 'Your gate pass request has been rejected',
      requestId: gatePass.requestId,
      controlNumber: gatePass.request.controlNumber,
      actionUrl: `/app/gate-pass/${id}`,
      metadata: { moduleId: 'gate-pass' },
    });

    return this.getById(id);
  },

  async returnForRevision(id: string, userId: string, note?: string) {
    const gatePass = await prisma.gatePass.findUnique({
      where: { id },
      include: { request: true },
    });
    if (!gatePass) throw new Error('Gate pass not found');

    await approvalService.returnToRequester(gatePass.requestId, userId, note);

    return this.getById(id);
  },

  async cancel(id: string, userId: string) {
    const gatePass = await prisma.gatePass.findUnique({
      where: { id },
      include: { request: true },
    });
    if (!gatePass) throw new Error('Gate pass not found');

    if (gatePass.request.requesterId !== userId) {
      throw new Error('Only the requester can cancel a gate pass');
    }

    await prisma.approvalRequest.update({
      where: { id: gatePass.requestId },
      data: { status: 'cancelled' },
    });

    await auditService.record('cancel', 'gate-pass', {
      actorId: userId,
      entityId: id,
      metadata: { controlNumber: gatePass.request.controlNumber },
    });

    return this.getById(id);
  },

  async securityRelease(id: string, userId: string) {
    const gatePass = await prisma.gatePass.findUnique({
      where: { id },
      include: { request: true },
    });
    if (!gatePass) throw new Error('Gate pass not found');
    if (gatePass.request.status !== 'approved')
      throw new Error('Only approved gate passes can be released');

    const updated = await prisma.gatePass.update({
      where: { id },
      data: {
        securityReleasedBy: userId,
        securityReleasedAt: new Date(),
      },
    });

    await auditService.record('security_release', 'gate-pass', {
      actorId: userId,
      entityId: id,
      metadata: { controlNumber: gatePass.request.controlNumber },
    });

    return this.getById(id);
  },

  async assignVehicle(id: string, vehicleId: string, userId: string) {
    const gatePass = await prisma.gatePass.findUnique({
      where: { id },
      include: { request: true },
    });
    if (!gatePass) throw new Error('Gate pass not found');

    const updated = await prisma.gatePass.update({
      where: { id },
      data: { vehicleId },
    });

    await auditService.record('assign_vehicle', 'gate-pass', {
      actorId: userId,
      entityId: id,
      metadata: { vehicleId, controlNumber: gatePass.request.controlNumber },
    });

    return this.getById(id);
  },

  async incrementPrintCount(id: string) {
    return prisma.gatePass.update({
      where: { id },
      data: { printCount: { increment: 1 } },
    });
  },

  async getDashboardStats(userId?: string) {
    const where = userId ? { request: { requesterId: userId } } : {};

    const [total, pending, approved, draft, rejected, todayCount] = await Promise.all([
      prisma.gatePass.count({ where }),
      prisma.gatePass.count({ where: { ...where, request: { status: 'pending' } } }),
      prisma.gatePass.count({ where: { ...where, request: { status: 'approved' } } }),
      prisma.gatePass.count({ where: { ...where, request: { status: 'draft' } } }),
      prisma.gatePass.count({ where: { ...where, request: { status: 'rejected' } } }),
      prisma.gatePass.count({
        where: {
          ...where,
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ]);

    return { total, pending, approved, draft, rejected, todayCount };
  },

  async generateControlNumber(moduleId: string): Promise<string> {
    const series = await prisma.controlNumberSeries.findUnique({ where: { moduleId } });
    if (!series) throw new Error(`No control number series configured for module: ${moduleId}`);

    const seq = series.nextSequence;
    const year = series.includeYear ? new Date().getFullYear().toString() : '';
    const month = series.includeMonth ? String(new Date().getMonth() + 1).padStart(2, '0') : '';

    const controlNumber = series.formatPattern
      .replace('{PREFIX}', series.prefix)
      .replace('{YEAR}', year)
      .replace('{MONTH}', month)
      .replace('{SEQ}', String(seq).padStart(series.sequenceLength, '0'))
      .replace('{SEPARATOR}', series.separator);

    await prisma.controlNumberSeries.update({
      where: { moduleId },
      data: { nextSequence: seq + 1 },
    });

    return controlNumber;
  },
};
