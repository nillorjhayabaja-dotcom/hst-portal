import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface WorkflowFilters {
  moduleId?: string;
  isActive?: boolean;
  search?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const workflowService = {
  async getAll(
    filters: WorkflowFilters = {},
    page = 1,
    pageSize = 50,
  ): Promise<PaginatedResult<any>> {
    const skip = (page - 1) * pageSize;
    const where: any = {};

    if (filters.moduleId) where.moduleId = filters.moduleId;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.workflow.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ moduleId: 'asc' }, { name: 'asc' }],
        include: {
          steps: { orderBy: { stepOrder: 'asc' } },
          _count: { select: { approvalRequests: true } },
        },
      }),
      prisma.workflow.count({ where }),
    ]);

    return { items, total, page, pageSize };
  },

  async getById(id: string) {
    const workflow = await prisma.workflow.findUnique({
      where: { id },
      include: {
        steps: { orderBy: { stepOrder: 'asc' }, include: { role: true } },
        approvalRequests: { take: 5, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    return workflow;
  },

  async getByModule(moduleId: string) {
    return prisma.workflow.findMany({
      where: { moduleId, isActive: true },
      orderBy: [{ name: 'asc' }],
      include: {
        steps: { orderBy: { stepOrder: 'asc' }, include: { role: true } },
        _count: { select: { approvalRequests: true } },
      },
    });
  },

  async create(data: {
    moduleId: string;
    name: string;
    description?: string;
    createdBy?: string;
    steps: Array<{
      name: string;
      roleId: string;
      stepOrder: number;
      isRequired?: boolean;
      label?: string;
      description?: string;
      autoApprove?: boolean;
      escalationEnabled?: boolean;
      escalationRoleId?: string;
      escalationHours?: number;
      parallelApproval?: boolean;
      conditionField?: string;
      conditionOperator?: string;
      conditionValue?: string;
    }>;
  }) {
    const workflow = await prisma.workflow.create({
      data: {
        moduleId: data.moduleId,
        name: data.name,
        description: data.description,
        createdBy: data.createdBy,
        version: 1,
        isActive: true,
        steps: { create: data.steps },
      },
      include: { steps: true },
    });

    return workflow;
  },

  async update(id: string, data: any) {
    const workflow = await prisma.workflow.findUnique({ where: { id } });
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const updateData: any = {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    };

    if (data.steps) {
      await prisma.workflowStep.deleteMany({ where: { workflowId: id } });
      updateData.steps = { create: data.steps };
      updateData.version = { increment: 1 };
    }

    return prisma.workflow.update({
      where: { id },
      data: updateData,
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });
  },

  async delete(id: string) {
    const workflow = await prisma.workflow.findUnique({
      where: { id },
      include: { _count: { select: { approvalRequests: true, steps: true } } },
    });

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    if (workflow._count.approvalRequests > 0) {
      throw new Error('Cannot delete workflow that has approval requests');
    }

    await prisma.workflow.delete({ where: { id } });
    return { id };
  },

  async duplicate(id: string) {
    const workflow = await prisma.workflow.findUnique({
      where: { id },
      include: { steps: true },
    });

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const duplicated = await prisma.workflow.create({
      data: {
        moduleId: workflow.moduleId,
        name: `${workflow.name} (Copy)`,
        description: workflow.description,
        version: 1,
        isActive: false,
        steps: {
          create: workflow.steps.map((step) => ({
            name: step.name,
            roleId: step.roleId,
            stepOrder: step.stepOrder,
            isRequired: step.isRequired,
            label: step.label,
            description: step.description,
            autoApprove: step.autoApprove,
            escalationEnabled: step.escalationEnabled,
            escalationRoleId: step.escalationRoleId,
            escalationHours: step.escalationHours,
            parallelApproval: step.parallelApproval,
            conditionField: step.conditionField,
            conditionOperator: step.conditionOperator,
            conditionValue: step.conditionValue,
          })),
        },
      },
      include: { steps: true },
    });

    return duplicated;
  },

  async toggle(id: string) {
    const workflow = await prisma.workflow.findUnique({ where: { id } });
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    return prisma.workflow.update({
      where: { id },
      data: { isActive: !workflow.isActive },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });
  },

  async getStats() {
    const [total, active, inactive, byModule] = await Promise.all([
      prisma.workflow.count(),
      prisma.workflow.count({ where: { isActive: true } }),
      prisma.workflow.count({ where: { isActive: false } }),
      prisma.workflow.groupBy({ by: ['moduleId'], _count: true }),
    ]);

    return { total, active, inactive, byModule };
  },
};
