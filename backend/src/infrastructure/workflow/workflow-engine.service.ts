import { workflowRepository } from '../database/repositories/workflow.repository';
import { prisma } from '../database/prisma.service';
import { NotFoundError, ValidationError } from '../../shared/errors';
import { generateId } from '../../shared/utils';

export interface WorkflowStepDef {
  id: string;
  name: string;
  roleId: string;
  stepOrder: number;
  isRequired: boolean;
  label?: string;
  autoApprove: boolean;
  escalationEnabled: boolean;
  escalationRoleId?: string | null;
  escalationHours?: number | null;
  parallelApproval: boolean;
  conditionField?: string | null;
  conditionOperator?: string | null;
  conditionValue?: string | null;
}

export interface StartRequestInput {
  moduleId: string;
  title: string;
  description?: string;
  requesterId: string;
  departmentId?: string;
  metadata?: Record<string, unknown>;
  workflowId?: string;
}

export interface StartedRequest {
  id: string;
  controlNumber: string;
  status: string;
  currentStepIndex: number;
}

export const workflowEngine = {
  async resolveWorkflow(moduleId: string, workflowId?: string) {
    let workflow = workflowId
      ? await workflowRepository.findById(workflowId)
      : (await workflowRepository.listByModule(moduleId))[0];
    if (!workflow) throw new NotFoundError(`No active workflow for module ${moduleId}`);
    return workflow;
  },

  async startRequest(input: StartRequestInput): Promise<StartedRequest> {
    const workflow = await this.resolveWorkflow(input.moduleId, input.workflowId);
    const controlNumber = await this.nextControlNumber(input.moduleId);

    const result = await prisma.$transaction(async (tx: import('@prisma/client').Prisma.TransactionClient) => {
      const request = await tx.approvalRequest.create({
        data: {
          controlNumber,
          moduleId: input.moduleId,
          title: input.title,
          description: input.description,
          requesterId: input.requesterId,
          departmentId: input.departmentId,
          status: 'pending',
          workflowId: workflow.id,
          currentStepIndex: 0,
          submittedAt: new Date(),
          metadata: input.metadata as any,
        },
      });

      const steps = (workflow.steps as WorkflowStepDef[])
        .filter((s) => this.conditionMet(s, input.metadata))
        .sort((a, b) => a.stepOrder - b.stepOrder);

      if (!steps.length) throw new ValidationError('Workflow has no applicable steps');

      await tx.approvalStep.createMany({
        data: steps.map((s) => ({
          requestId: request.id,
          stepId: s.id,
          name: s.name,
          roleId: s.roleId,
          stepOrder: s.stepOrder,
          status: 'current',
          assignedAt: new Date(),
        })),
      });

      for (const s of steps) {
        if (s.autoApprove) {
          await tx.approvalStep.update({
            where: { requestId_stepId: { requestId: request.id, stepId: s.id } },
            data: { status: 'approved', actedAt: new Date() },
          });
        }
      }

      return request;
    });

    return {
      id: result.id,
      controlNumber: result.controlNumber,
      status: result.status,
      currentStepIndex: result.currentStepIndex,
    };
  },

  conditionMet(step: WorkflowStepDef, metadata?: Record<string, unknown>): boolean {
    if (!step.conditionField || !step.conditionOperator) return true;
    const value = metadata?.[step.conditionField];
    if (value === undefined) return true;
    switch (step.conditionOperator) {
      case 'eq':
        return String(value) === step.conditionValue;
      case 'neq':
        return String(value) !== step.conditionValue;
      case 'gt':
        return Number(value) > Number(step.conditionValue);
      case 'lt':
        return Number(value) < Number(step.conditionValue);
      case 'gte':
        return Number(value) >= Number(step.conditionValue);
      case 'lte':
        return Number(value) <= Number(step.conditionValue);
      case 'in':
        return (step.conditionValue || '').split(',').includes(String(value));
      default:
        return true;
    }
  },

  async nextControlNumber(moduleId: string): Promise<string> {
    const series = await prisma.controlNumberSeries.findUnique({ where: { moduleId } });
    if (!series) return `${moduleId.toUpperCase()}-${generateId().slice(0, 8).toUpperCase()}`;
    const seq = String(series.nextSequence).padStart(series.sequenceLength, '0');
    const year = series.includeYear ? new Date().getFullYear() : '';
    const month = series.includeMonth ? String(new Date().getMonth() + 1).padStart(2, '0') : '';
    const parts = [series.prefix, year, month, seq].filter(Boolean);
    const control = parts.join(series.separator);
    await prisma.controlNumberSeries.update({
      where: { moduleId },
      data: { nextSequence: { increment: 1 } },
    });
    return control;
  },

  async getPendingSteps(requestId: string, roleId: string) {
    return prisma.approvalStep.findMany({
      where: { requestId, roleId, status: 'current' },
    });
  },
};