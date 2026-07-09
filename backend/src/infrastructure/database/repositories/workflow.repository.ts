import { prisma } from '../prisma.service';

export const workflowRepository = {
  async listByModule(moduleId: string) {
    return prisma.workflow.findMany({
      where: { moduleId, isActive: true },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });
  },

  async findById(id: string) {
    return prisma.workflow.findUnique({
      where: { id },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });
  },

  async create(data: {
    moduleId: string;
    name: string;
    description?: string;
    createdBy?: string;
    steps: {
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
    }[];
  }) {
    return prisma.workflow.create({
      data: {
        moduleId: data.moduleId,
        name: data.name,
        description: data.description,
        createdBy: data.createdBy,
        steps: { create: data.steps },
      },
      include: { steps: true },
    });
  },
};