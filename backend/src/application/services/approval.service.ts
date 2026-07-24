import { PrismaClient } from '@prisma/client';
import { auditService } from '../../infrastructure/audit/audit.service';

const prisma = new PrismaClient();

export interface ApprovalFilters {
  moduleId?: string;
  status?: string;
  requesterId?: string;
  approverId?: string;
  departmentId?: string;
  search?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const approvalService = {
  async getAll(
    filters: ApprovalFilters = {},
    page = 1,
    pageSize = 20,
  ): Promise<PaginatedResult<any>> {
    const skip = (page - 1) * pageSize;
    const where: any = {};

    if (filters.moduleId) where.moduleId = filters.moduleId;
    if (filters.status) where.status = filters.status;
    if (filters.requesterId) where.requesterId = filters.requesterId;
    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.approverId) {
      where.steps = { some: { actorId: filters.approverId } };
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { controlNumber: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.approvalRequest.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          requester: { select: { id: true, employeeId: true, displayName: true } },
          department: { select: { id: true, name: true, code: true } },
          workflow: { select: { id: true, name: true } },
          steps: {
            orderBy: { stepOrder: 'asc' },
            include: { role: true, actor: { select: { displayName: true } } },
          },
        },
      }),
      prisma.approvalRequest.count({ where }),
    ]);

    return { items, total, page, pageSize };
  },

  async getPending(approverId: string, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      prisma.approvalRequest.findMany({
        where: {
          status: { in: ['pending', 'in_review'] },
          steps: { some: { actorId: approverId, status: 'current' } },
        },
        skip,
        take: pageSize,
        orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
        include: {
          requester: { select: { id: true, employeeId: true, displayName: true } },
          department: { select: { id: true, name: true, code: true } },
          steps: { where: { actorId: approverId }, include: { role: true } },
        },
      }),
      prisma.approvalRequest.count({
        where: {
          status: { in: ['pending', 'in_review'] },
          steps: { some: { actorId: approverId, status: 'current' } },
        },
      }),
    ]);

    return { items, total, page, pageSize };
  },

  async getMine(userId: string, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      prisma.approvalRequest.findMany({
        where: { requesterId: userId },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          department: { select: { id: true, name: true, code: true } },
          steps: {
            orderBy: { stepOrder: 'asc' },
            include: { role: true, actor: { select: { displayName: true } } },
          },
        },
      }),
      prisma.approvalRequest.count({ where: { requesterId: userId } }),
    ]);

    return { items, total, page, pageSize };
  },

  async getById(id: string, userId?: string, userRoles?: string[]) {
    const request = await prisma.approvalRequest.findUnique({
      where: { id },
      include: {
        requester: { select: { id: true, employeeId: true, displayName: true, email: true } },
        department: { select: { id: true, name: true, code: true } },
        workflow: {
          include: { steps: { orderBy: { stepOrder: 'asc' }, include: { role: true } } },
        },
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
    });

    if (!request) throw new Error('Approval request not found');

    // SECURITY: Validate ownership and authorization
    if (userId && userRoles) {
      const isOwner = request.requesterId === userId;
      const isAdmin = userRoles.some(r => ['super_admin', 'admin'].includes(r));
      
      // Check if user is an approver in the current workflow
      const isApprover = request.steps.some(step => {
        const stepRoleName = step.role?.name?.toLowerCase() || '';
        return userRoles.some(role => 
          role === stepRoleName || 
          step.roleId === role ||
          (step.status === 'current' || step.status === 'pending')
        );
      });

      // Grant access if: owner, admin, or assigned approver
      if (!isOwner && !isAdmin && !isApprover) {
        // Log unauthorized access attempt
        await auditService.record('access_denied', 'approval_request', {
          actorId: userId,
          entityId: id,
          metadata: {
            requestId: id,
            requesterId: request.requesterId,
            userRoles,
            requestStatus: request.status,
            reason: 'User attempted to access approval request without ownership or approval authority'
          }
        }).catch(() => {
          // Silently fail audit logging
        });
        
        throw new Error('You do not have permission to view this request');
      }
    }

    return request;
  },

  async startWorkflow(requestId: string, userId: string) {
    const request = await prisma.approvalRequest.findUnique({
      where: { id: requestId },
      include: { workflow: { include: { steps: { orderBy: { stepOrder: 'asc' } } } } },
    });

    if (!request || !request.workflow) throw new Error('No workflow configured for this request');

    const steps = request.workflow.steps;
    if (steps.length === 0) throw new Error('Workflow has no steps');

    // Create approval steps from workflow
    const approvalSteps = steps.map((step, index) => ({
      requestId,
      stepId: step.id,
      name: step.name,
      roleId: step.roleId,
      stepOrder: step.stepOrder,
      status: index === 0 ? 'current' : 'pending',
    }));

    await prisma.approvalStep.createMany({ data: approvalSteps });

    return request;
  },

  async approve(requestId: string, userId: string, note?: string) {
    const request = await prisma.approvalRequest.findUnique({
      where: { id: requestId },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });
    if (!request) throw new Error('Request not found');

    const currentStep = request.steps.find((s) => s.status === 'current');
    if (!currentStep) throw new Error('No current step to approve');

    await prisma.approvalStep.update({
      where: { id: currentStep.id },
      data: { status: 'approved', actorId: userId, note, actedAt: new Date() },
    });

    await prisma.approvalAction.create({
      data: { requestId, stepId: currentStep.id, action: 'approve', actorId: userId, note },
    });

    // Check if next step exists
    const nextStep = request.steps.find(
      (s) => s.stepOrder > currentStep.stepOrder && s.status === 'pending',
    );
    if (nextStep) {
      await prisma.approvalStep.update({
        where: { id: nextStep.id },
        data: { status: 'current', assignedAt: new Date() },
      });
      await prisma.approvalRequest.update({
        where: { id: requestId },
        data: { status: 'in_review', currentStepIndex: nextStep.stepOrder },
      });
      return { status: 'in_review', step: nextStep };
    }

    // All steps approved
    await prisma.approvalRequest.update({
      where: { id: requestId },
      data: { status: 'approved', completedAt: new Date() },
    });

    return { status: 'approved' };
  },

  async reject(requestId: string, userId: string, note?: string) {
    const request = await prisma.approvalRequest.findUnique({
      where: { id: requestId },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });
    if (!request) throw new Error('Request not found');

    const currentStep = request.steps.find((s) => s.status === 'current');
    if (currentStep) {
      await prisma.approvalStep.update({
        where: { id: currentStep.id },
        data: { status: 'rejected', actorId: userId, note, actedAt: new Date() },
      });
    }

    await prisma.approvalAction.create({
      data: { requestId, action: 'reject', actorId: userId, note },
    });

    await prisma.approvalRequest.update({
      where: { id: requestId },
      data: { status: 'rejected', completedAt: new Date() },
    });

    return { status: 'rejected' };
  },

  async returnToRequester(requestId: string, userId: string, note?: string) {
    const request = await prisma.approvalRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new Error('Request not found');

    await prisma.approvalAction.create({
      data: { requestId, action: 'return', actorId: userId, note },
    });

    await prisma.approvalRequest.update({
      where: { id: requestId },
      data: { status: 'returned' },
    });

    return { status: 'returned' };
  },

  async delegate(requestId: string, delegateId: string, userId: string) {
    const request = await prisma.approvalRequest.findUnique({
      where: { id: requestId },
      include: { steps: { where: { status: 'current' } } },
    });
    if (!request) throw new Error('Request not found');

    const currentStep = request.steps[0];
    if (currentStep) {
      await prisma.approvalStep.update({
        where: { id: currentStep.id },
        data: { actorId: delegateId, delegatedTo: userId },
      });
    }

    await prisma.approvalAction.create({
      data: { requestId, action: 'delegate', actorId: userId },
    });

    return { status: 'delegated' };
  },

  async recall(requestId: string, userId: string) {
    const request = await prisma.approvalRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new Error('Request not found');
    if (request.requesterId !== userId) throw new Error('Only the requester can recall');

    await prisma.approvalAction.create({
      data: { requestId, action: 'recall', actorId: userId },
    });

    await prisma.approvalRequest.update({
      where: { id: requestId },
      data: { status: 'draft' },
    });

    return { status: 'recalled' };
  },

  async getDashboardStats(userId?: string) {
    const userFilter = userId ? { requesterId: userId } : {};
    
    console.log('[APPROVAL SERVICE] User ID for filtering:', userId);
    console.log('[APPROVAL SERVICE] User filter:', JSON.stringify(userFilter));
    
    const [total, pending, approved, rejected, todayCount] = await Promise.all([
      prisma.approvalRequest.count({ where: userFilter }),
      prisma.approvalRequest.count({ 
        where: { 
          ...userFilter,
          status: { in: ['pending', 'in_review'] } 
        } 
      }),
      prisma.approvalRequest.count({ where: { ...userFilter, status: 'approved' } }),
      prisma.approvalRequest.count({ where: { ...userFilter, status: 'rejected' } }),
      prisma.approvalRequest.count({
        where: { 
          ...userFilter,
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } 
        },
      }),
    ]);

    console.log('[APPROVAL SERVICE] Results:', { total, pending, approved, rejected, todayCount });

    return { total, pending, approved, rejected, todayCount };
  },
};
