import type { Request, Response, NextFunction } from 'express';
import { employeeRepository } from '../../../infrastructure/database/repositories/employee.repository';
import { toPagination, buildMeta } from '../../../shared/types';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../../../infrastructure/auth/rbac.middleware';
import { auditService } from '../../../infrastructure/audit/audit.service';
import { NotFoundError } from '../../../shared/errors';
import type { AuthUser } from '../../../shared/types';

export const employeeController = {
  list: [
    authenticate,
    requirePermission('employees', 'view'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const p = toPagination(req.query as any);
        const { departmentId } = req.query as any;
        const { items, total } = await employeeRepository.list({
          skip: p.skip,
          take: p.take,
          departmentId: departmentId as string | undefined,
        });
        res.json({ success: true, data: items, meta: buildMeta(total, p) });
      } catch (err) {
        next(err);
      }
    },
  ],

  get: [
    authenticate,
    requirePermission('employees', 'view'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const emp = await employeeRepository.findById(req.params.id);
        if (!emp) throw new NotFoundError('Employee not found');
        res.json({ success: true, data: emp });
      } catch (err) {
        next(err);
      }
    },
  ],

  create: [
    authenticate,
    requirePermission('employees', 'create'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as AuthUser;
        const body = req.body;
        const emp = await employeeRepository.create({
          employeeNumber: body.employeeNumber,
          userId: body.userId,
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          phone: body.phone,
          title: body.title,
          departmentId: body.departmentId,
          positionId: body.positionId,
          supervisorId: body.supervisorId,
          hireDate: new Date(body.hireDate),
          status: body.status,
        });
        await auditService.fromRequest(req, 'create', 'employee', { entityId: emp.id });
        res.status(201).json({ success: true, data: emp });
      } catch (err) {
        next(err);
      }
    },
  ],

  update: [
    authenticate,
    requirePermission('employees', 'edit'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const emp = await employeeRepository.update(req.params.id, req.body);
        await auditService.fromRequest(req, 'update', 'employee', { entityId: emp.id });
        res.json({ success: true, data: emp });
      } catch (err) {
        next(err);
      }
    },
  ],
};