import { prisma } from '../../infrastructure/database/prisma.service';
import { auditService } from '../../infrastructure/audit/audit.service';
import { NotFoundError, ValidationError } from '../../shared/errors';

export interface CompanionInput {
  fullName: string;
  employeeId?: string;
}

export class GatePassCompanionService {
  /**
   * Get all companions for a gate pass
   */
  async getCompanions(gatePassId: string) {
    return prisma.gatePassCompanion.findMany({
      where: { gatePassId },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get all companions by requestId (via gate pass)
   */
  async getCompanionsByRequestId(requestId: string) {
    const gatePass = await prisma.gatePass.findUnique({
      where: { requestId },
      select: { id: true },
    });
    if (!gatePass) return [];
    return this.getCompanions(gatePass.id);
  }

  /**
   * Add a companion to a gate pass
   */
  async addCompanion(
    gatePassId: string,
    data: CompanionInput,
    actorId: string
  ) {
    const gatePass = await prisma.gatePass.findUnique({
      where: { id: gatePassId },
      select: { id: true, requestId: true },
    });
    if (!gatePass) {
      throw new NotFoundError('Gate pass not found');
    }

    // If employeeId is provided, validate and get full name from employee record
    let fullName = data.fullName;
    if (data.employeeId) {
      const employee = await prisma.employee.findUnique({
        where: { id: data.employeeId },
        select: { firstName: true, lastName: true },
      });
      if (!employee) {
        throw new ValidationError('Employee not found');
      }
      // Use the employee's name as stored
      fullName = `${employee.firstName} ${employee.lastName}`;
    }

    const companion = await prisma.gatePassCompanion.create({
      data: {
        gatePassId,
        employeeId: data.employeeId || null,
        fullName,
        createdBy: actorId,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
          },
        },
      },
    });

    // Audit log
    await auditService.record('add_companion', 'gate_pass', {
      actorId,
      entityId: gatePassId,
      targetId: companion.id,
      metadata: {
        companionName: fullName,
        employeeId: data.employeeId || null,
        requestId: gatePass.requestId,
      },
    });

    return companion;
  }

  /**
   * Add multiple companions at once (for initial submission)
   */
  async addCompanionsBulk(
    gatePassId: string,
    companions: CompanionInput[],
    actorId: string
  ) {
    const results = [];
    for (const comp of companions) {
      const result = await this.addCompanion(gatePassId, comp, actorId);
      results.push(result);
    }
    return results;
  }

  /**
   * Remove a companion
   */
  async removeCompanion(companionId: string, actorId: string) {
    const companion = await prisma.gatePassCompanion.findUnique({
      where: { id: companionId },
      select: { id: true, gatePassId: true, fullName: true },
    });
    if (!companion) {
      throw new NotFoundError('Companion not found');
    }

    await prisma.gatePassCompanion.delete({
      where: { id: companionId },
    });

    // Audit log
    await auditService.record('remove_companion', 'gate_pass', {
      actorId,
      entityId: companion.gatePassId,
      targetId: companionId,
      metadata: {
        companionName: companion.fullName,
      },
    });

    return { success: true, removedName: companion.fullName };
  }

  /**
   * Update a companion
   */
  async updateCompanion(
    companionId: string,
    data: { fullName?: string; employeeId?: string },
    actorId: string
  ) {
    const companion = await prisma.gatePassCompanion.findUnique({
      where: { id: companionId },
      select: { id: true, gatePassId: true, fullName: true, employeeId: true },
    });
    if (!companion) {
      throw new NotFoundError('Companion not found');
    }

    let fullName = data.fullName || companion.fullName;
    if (data.employeeId) {
      const employee = await prisma.employee.findUnique({
        where: { id: data.employeeId },
        select: { firstName: true, lastName: true },
      });
      if (!employee) {
        throw new ValidationError('Employee not found');
      }
      fullName = `${employee.firstName} ${employee.lastName}`;
    }

    const updated = await prisma.gatePassCompanion.update({
      where: { id: companionId },
      data: {
        fullName,
        employeeId: data.employeeId !== undefined ? data.employeeId : companion.employeeId,
      },
    });

    // Audit log
    await auditService.record('update_companion', 'gate_pass', {
      actorId,
      entityId: companion.gatePassId,
      targetId: companionId,
      metadata: {
        previousName: companion.fullName,
        newName: fullName,
        previousEmployeeId: companion.employeeId,
        newEmployeeId: data.employeeId,
      },
    });

    return updated;
  }

  /**
   * Delete all companions for a gate pass (used when resubmitting)
   */
  async clearCompanions(gatePassId: string, actorId: string) {
    const companions = await prisma.gatePassCompanion.findMany({
      where: { gatePassId },
      select: { id: true },
    });

    await prisma.gatePassCompanion.deleteMany({
      where: { gatePassId },
    });

    if (companions.length > 0) {
      await auditService.record('clear_companions', 'gate_pass', {
        actorId,
        entityId: gatePassId,
        metadata: { count: companions.length },
      });
    }

    return { success: true, removedCount: companions.length };
  }

  /**
   * Format companions for display
   */
  formatCompanionsList(companions: any[]): string {
    if (!companions || companions.length === 0) return 'None';
    return companions
      .map((c) => c.fullName)
      .join('; ');
  }
}

export const gatePassCompanionService = new GatePassCompanionService();