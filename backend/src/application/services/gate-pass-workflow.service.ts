import { prisma } from '../../infrastructure/database/prisma.service';
import { auditService } from '../../infrastructure/audit/audit.service';
import { notificationService } from '../../infrastructure/notifications/notification.service';
import { fileStorageService } from '../../infrastructure/storage/file-storage.service';
import { NotFoundError, ValidationError, ApprovalSignatureRequiredError } from '../../shared/errors';
import { workflowEngine } from '../../infrastructure/workflow/workflow-engine.service';
import { qrTokenService } from './qr-token.service';
import { GatePassPDFService } from './gate-pass-pdf.service';

export interface ApprovalStepResult {
  success: boolean;
  nextStep?: string;
  status: string;
  message: string;
}

export class GatePassWorkflowService {
  /**
   * Approve a gate pass with sequential workflow logic
   * Enforces signature requirement and proper step progression
   */
  async approveStep(
    requestId: string,
    actorId: string,
    actorName: string,
    stepName: string,
    note?: string,
    signature?: { originalname: string; mimetype: string; size: number; stream: any }
  ): Promise<ApprovalStepResult> {
    const request = await prisma.approvalRequest.findUnique({
      where: { id: requestId },
      include: {
        gatePass: true,
        steps: {
          where: { status: 'current' },
          orderBy: { stepOrder: 'asc' },
        },
        workflow: {
          include: {
            steps: {
              orderBy: { stepOrder: 'asc' },
            },
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundError('Gate pass request not found');
    }

    if (!request.gatePass) {
      throw new ValidationError('Gate pass not found for this request');
    }

    // Get the current pending step
    const currentStep = request.steps[0];
    if (!currentStep) {
      return {
        success: false,
        status: request.status,
        message: 'No pending approval steps found',
      };
    }

    // Verify the actor is assigned to the current step
    if (currentStep.actorId && currentStep.actorId !== actorId) {
      // Check if user has the required role for this step
      const userRoles = await prisma.userRole.findMany({
        where: { userId: actorId, roleId: currentStep.roleId },
      });

      if (userRoles.length === 0) {
        return {
          success: false,
          status: request.status,
          message: 'You are not authorized to approve this step',
        };
      }
    }

    // Validate signature is provided
    if (!signature) {
      throw new ApprovalSignatureRequiredError();
    }

    // Validate signature format
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedMimeTypes.includes(signature.mimetype)) {
      throw new ValidationError('Invalid signature format. Allowed: PNG, JPG, JPEG, WEBP');
    }

    // Validate signature size (max 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (signature.size > maxSize) {
      throw new ValidationError('Signature file size exceeds 2MB limit');
    }

    let signaturePath: string | undefined;

    try {
      // Save signature - pass actorId as uploadedBy (FK to users table)
      const uploadedFile = await fileStorageService.upload(
        signature,
        'signatures',
        actorId,
        actorId  // uploadedBy must be a valid user UUID, not a year string
      );
      signaturePath = uploadedFile.storagePath;

      // Create approval action with signature
      await prisma.approvalAction.create({
        data: {
          requestId,
          stepId: currentStep.id,
          action: 'approve',
          actorId,
          note,
          signaturePath,
          metadata: {
            stepName: currentStep.name,
            stepOrder: currentStep.stepOrder,
            approvedAt: new Date(),
          },
        },
      });

      // Update the current step
      await prisma.approvalStep.update({
        where: { id: currentStep.id },
        data: {
          status: 'approved',
          actorId,
          actedAt: new Date(),
          note,
        },
      });

      // Write audit log
      await auditService.record('approve', 'gate_pass', {
        actorId,
        entityId: request.gatePass.id,
        targetId: currentStep.id,
        metadata: {
          controlNumber: request.controlNumber,
          stepName: currentStep.name,
          stepOrder: currentStep.stepOrder,
          note,
          signaturePath,
        },
      });

      // Determine next step
      const nextStepResult = await this.determineNextStep(request, currentStep);

      // Update request status and current step
      if (nextStepResult.isComplete) {
        // All steps completed - mark as approved
        await prisma.approvalRequest.update({
          where: { id: requestId },
          data: {
            status: 'approved',
            completedAt: new Date(),
            currentStepIndex: request.workflow!.steps.length,
          },
        });

        // Update gate pass with approval tracking
        await prisma.gatePass.update({
          where: { requestId },
          data: {
            approvalStage: 'approved',
            approvedBy: actorId,
            approvedAt: new Date(),
          },
        });

        // Generate QR token and code
        const qrToken = await qrTokenService.generateToken(requestId);

        // Generate PDF
        const pdfService = new GatePassPDFService();
        const pdfPath = await pdfService.generateGatePassPDF(requestId);

        // Send notifications
        await this.sendApprovalNotifications(request, 'approved');

        return {
          success: true,
          status: 'approved',
          message: 'Gate pass approved successfully',
        };
      } else if (nextStepResult.skipStep) {
        // Skip to next step (e.g., car assignee not needed)
        await this.advanceToNextStep(request, nextStepResult.nextStepOrder!);
        
        return {
          success: true,
          nextStep: nextStepResult.nextStepName,
          status: request.status,
          message: nextStepResult.message || 'Approved, moving to next step',
        };
      } else {
        // Move to next step
        await this.advanceToNextStep(request, nextStepResult.nextStepOrder!);

        // Notify next approver
        await this.notifyNextApprover(request, nextStepResult.nextStepOrder!);

        return {
          success: true,
          nextStep: nextStepResult.nextStepName,
          status: request.status,
          message: 'Approved, forwarded to next approver',
        };
      }
    } catch (error) {
      // Log error but don't rollback signature - it can be cleaned up later if needed
      console.error('Workflow approval error:', error);
      throw error;
    }
  }

  /**
   * Determine the next step based on workflow logic
   */
  private async determineNextStep(
    request: any,
    currentStep: any
  ): Promise<{
    isComplete: boolean;
    skipStep?: boolean;
    nextStepOrder?: number;
    nextStepName?: string;
    message?: string;
  }> {
    if (!request.workflow) {
      return { isComplete: true };
    }

    const currentOrder = currentStep.stepOrder;
    const remainingSteps = request.workflow.steps.filter(
      (s: any) => s.stepOrder > currentOrder
    );

    if (remainingSteps.length === 0) {
      return { isComplete: true };
    }

    const nextStep = remainingSteps[0];

    // Check if next step should be skipped based on conditions
    if (nextStep.conditionField && request.metadata) {
      const conditionMet = this.evaluateCondition(
        nextStep.conditionField,
        nextStep.conditionOperator,
        nextStep.conditionValue,
        request.metadata
      );

      if (!conditionMet && nextStep.isRequired === false) {
        // Skip this step and check the next one
        return this.determineNextStep(request, {
          ...currentStep,
          stepOrder: nextStep.stepOrder,
        });
      }
    }

    return {
      isComplete: false,
      nextStepOrder: nextStep.stepOrder,
      nextStepName: nextStep.name,
    };
  }

  /**
   * Evaluate workflow step condition
   */
  private evaluateCondition(
    field: string,
    operator: string | null,
    value: string | null,
    metadata: Record<string, any>
  ): boolean {
    const fieldValue = metadata[field];

    if (!operator || value === null) return true;

    switch (operator) {
      case 'eq':
        return String(fieldValue) === value;
      case 'neq':
        return String(fieldValue) !== value;
      case 'gt':
        return Number(fieldValue) > Number(value);
      case 'lt':
        return Number(fieldValue) < Number(value);
      case 'gte':
        return Number(fieldValue) >= Number(value);
      case 'lte':
        return Number(fieldValue) <= Number(value);
      case 'in':
        return (value || '').split(',').includes(String(fieldValue));
      default:
        return true;
    }
  }

  /**
   * Advance workflow to the next step
   */
  private async advanceToNextStep(request: any, nextStepOrder: number) {
    // Mark all remaining steps as pending (not current)
    await prisma.approvalStep.updateMany({
      where: {
        requestId: request.id,
        stepOrder: { gt: nextStepOrder - 1 },
        status: 'pending',
      },
      data: {
        status: 'pending',
        assignedAt: new Date(),
      },
    });

    // Mark the next step as current
    await prisma.approvalStep.updateMany({
      where: {
        requestId: request.id,
        stepOrder: nextStepOrder,
      },
      data: {
        status: 'current',
        assignedAt: new Date(),
      },
    });

    // Update request current step index
    await prisma.approvalRequest.update({
      where: { id: request.id },
      data: { currentStepIndex: nextStepOrder },
    });
  }

  /**
   * Notify the next approver
   */
  private async notifyNextApprover(request: any, nextStepOrder: number) {
    const nextStep = request.workflow?.steps.find((s: any) => s.stepOrder === nextStepOrder);
    if (!nextStep) return;

    // Get all users with the required role
    const usersWithRole = await prisma.userRole.findMany({
      where: { roleId: nextStep.roleId },
      include: { user: { select: { id: true, email: true, displayName: true } } },
    });

    // Send notifications
    for (const userRole of usersWithRole) {
      await notificationService.notifyUser(userRole.user.id, {
        title: `Gate Pass Approval Required`,
        message: `Gate pass ${request.controlNumber} requires your approval`,
        actionUrl: `/app/m/gate-pass/request/${request.id}`,
        requestId: request.id,
        controlNumber: request.controlNumber,
        metadata: { moduleId: 'gate-pass', stepName: nextStep.name },
      });
    }
  }

  /**
   * Send notifications based on approval status
   */
  private async sendApprovalNotifications(request: any, status: string) {
    // Notify requester
    await notificationService.notifyUser(request.requesterId, {
      title: 'Gate Pass Approved',
      message: `Your gate pass ${request.controlNumber} has been fully approved`,
      actionUrl: '/app/m/gate-pass',
      requestId: request.id,
      controlNumber: request.controlNumber,
      metadata: { moduleId: 'gate-pass', status },
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
          title: 'New Approved Gate Pass',
          message: `Gate pass ${request.controlNumber} is ready for verification`,
          actionUrl: '/app/guard',
          requestId: request.id,
          controlNumber: request.controlNumber,
          metadata: { moduleId: 'gate-pass', status },
        });
      }
    }
  }

  /**
   * Reject a gate pass
   */
  async rejectStep(
    requestId: string,
    actorId: string,
    actorName: string,
    reason: string
  ): Promise<ApprovalStepResult> {
    const request = await prisma.approvalRequest.findUnique({
      where: { id: requestId },
      include: {
        gatePass: true,
        steps: {
          where: { status: 'current' },
        },
      },
    });

    if (!request || !request.gatePass) {
      throw new NotFoundError('Gate pass not found');
    }

    const currentStep = request.steps[0];
    if (!currentStep) {
      return {
        success: false,
        status: request.status,
        message: 'No pending approval steps found',
      };
    }

    // Create rejection action
    await prisma.approvalAction.create({
      data: {
        requestId,
        stepId: currentStep.id,
        action: 'reject',
        actorId,
        note: reason,
        metadata: {
          rejectedAt: new Date(),
        },
      },
    });

    // Update step status
    await prisma.approvalStep.update({
      where: { id: currentStep.id },
      data: {
        status: 'rejected',
        actorId,
        actedAt: new Date(),
        note: reason,
      },
    });

    // Update request status
    await prisma.approvalRequest.update({
      where: { id: requestId },
      data: {
        status: 'rejected',
        completedAt: new Date(),
      },
    });

    // Audit log
    await auditService.record('reject', 'gate_pass', {
      actorId,
      entityId: request.gatePass.id,
      targetId: currentStep.id,
      metadata: {
        controlNumber: request.controlNumber,
        reason,
        stepName: currentStep.name,
      },
    });

    // Notify requester
    await notificationService.notifyUser(request.requesterId, {
      title: 'Gate Pass Rejected',
      message: `Your gate pass ${request.controlNumber} was rejected: ${reason}`,
      actionUrl: '/app/m/gate-pass',
      requestId: request.id,
      controlNumber: request.controlNumber,
      metadata: { moduleId: 'gate-pass', status: 'rejected' },
    });

    return {
      success: true,
      status: 'rejected',
      message: 'Gate pass rejected',
    };
  }

  /**
   * Return a gate pass for revision
   */
  async returnStep(
    requestId: string,
    actorId: string,
    actorName: string,
    note: string
  ): Promise<ApprovalStepResult> {
    const request = await prisma.approvalRequest.findUnique({
      where: { id: requestId },
      include: {
        gatePass: true,
        steps: {
          where: { status: 'current' },
        },
      },
    });

    if (!request || !request.gatePass) {
      throw new NotFoundError('Gate pass not found');
    }

    const currentStep = request.steps[0];
    if (!currentStep) {
      return {
        success: false,
        status: request.status,
        message: 'No pending approval steps found',
      };
    }

    // Create return action
    await prisma.approvalAction.create({
      data: {
        requestId,
        stepId: currentStep.id,
        action: 'return',
        actorId,
        note,
        metadata: {
          returnedAt: new Date(),
        },
      },
    });

    // Reset current step to pending
    await prisma.approvalStep.update({
      where: { id: currentStep.id },
      data: {
        status: 'pending',
        note,
      },
    });

    // Reset all subsequent steps
    await prisma.approvalStep.updateMany({
      where: {
        requestId,
        stepOrder: { gt: currentStep.stepOrder },
      },
      data: {
        status: 'pending',
        actorId: null,
        actedAt: null,
        note: null,
      },
    });

    // Update request status
    await prisma.approvalRequest.update({
      where: { id: requestId },
      data: {
        status: 'returned',
        currentStepIndex: 0,
      },
    });

    // Audit log
    await auditService.record('return', 'gate_pass', {
      actorId,
      entityId: request.gatePass.id,
      targetId: currentStep.id,
      metadata: {
        controlNumber: request.controlNumber,
        note,
        stepName: currentStep.name,
      },
    });

    // Notify requester
    await notificationService.notifyUser(request.requesterId, {
      title: 'Gate Pass Returned',
      message: `Your gate pass ${request.controlNumber} was returned for revision: ${note}`,
      actionUrl: '/app/m/gate-pass',
      requestId: request.id,
      controlNumber: request.controlNumber,
      metadata: { moduleId: 'gate-pass', status: 'returned' },
    });

    return {
      success: true,
      status: 'returned',
      message: 'Gate pass returned for revision',
    };
  }

  /**
   * Get workflow status and current step information
   */
  async getWorkflowStatus(requestId: string) {
    const request = await prisma.approvalRequest.findUnique({
      where: { id: requestId },
      include: {
        gatePass: true,
        workflow: {
          include: {
            steps: {
              orderBy: { stepOrder: 'asc' },
              include: {
                role: true,
              },
            },
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
    });

    if (!request) {
      throw new NotFoundError('Gate pass request not found');
    }

    return {
      requestId: request.id,
      controlNumber: request.controlNumber,
      status: request.status,
      currentStepIndex: request.currentStepIndex,
      workflow: request.workflow,
      steps: request.steps,
      actions: request.actions,
      gatePass: request.gatePass,
    };
  }
}