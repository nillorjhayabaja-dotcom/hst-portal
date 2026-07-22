import type { Request, Response, NextFunction } from 'express';
import { GatePassService } from '../../../application/services/gate-pass.service';
import { GatePassQRService } from '../../../application/services/gate-pass-qr.service';
import { toPagination, buildMeta } from '../../../shared/types';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../../../infrastructure/auth/rbac.middleware';
import { auditService } from '../../../infrastructure/audit/audit.service';
import { NotFoundError, SignatureUploadFailedError } from '../../../shared/errors';
import type { AuthUser } from '../../../shared/types';
import { mapGatePassToListItem, mapGatePassToDetail } from '../dto/gate-pass.dto';
import multer from 'multer';
import { env } from '../../../infrastructure/config/env';
import { createReadStream } from 'node:fs';

const upload = multer({
  dest: env.upload.path,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

const gatePassService = new GatePassService();
const gatePassQRService = new GatePassQRService();

/**
 * Convert multer file to the format expected by fileStorageService
 * which requires a readable stream. Multer's disk storage writes to
 * disk and provides `path` — we create a stream from that path.
 */
function multerFileToSignature(file: Express.Multer.File) {
  return {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    stream: createReadStream(file.path),
  };
}

export const gatePassController = {
  submit: [
    authenticate,
    requirePermission('gate-pass', 'create'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as AuthUser;
        const body = req.body;

        const result = await gatePassService.submit({
          purpose: body.purpose,
          destination: body.destination,
          items: body.items,
          expectedReturn: body.expectedReturn ? new Date(body.expectedReturn) : undefined,
          notes: body.notes,
          requesterId: user.id,
          departmentId: body.departmentId,
        });

        res.status(201).json({
          success: true,
          data: result,
          message: `Gate pass submitted successfully. Control No: ${result.controlNumber}`,
        });
      } catch (err: any) {
        console.error('Submit gate pass error:', err);
        next(err);
      }
    },
  ],

  list: [
    authenticate,
    requirePermission('gate-pass', 'view'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const p = toPagination(req.query as any);
        const { status, requesterId, departmentId, search, startDate, endDate } = req.query as any;
        const user = req.user as AuthUser;

        const userRoles = user.roles || ['employee'];

        const result = await gatePassService.getAll({
          status,
          requesterId,
          departmentId,
          search,
          startDate,
          endDate,
          page: p.page,
          pageSize: p.pageSize,
          currentUserId: user.id,
          userRoles,
          userDepartmentId: user.employeeId,
        });

        const mappedData = result.items.map(mapGatePassToListItem);

        res.json({
          success: true,
          data: mappedData,
          total: result.total,
          page: result.page,
          pageSize: result.pageSize
        });
      } catch (err) {
        next(err);
      }
    },
  ],

  get: [
    authenticate,
    requirePermission('gate-pass', 'view'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const gatePass = await gatePassService.getById(req.params.id);
        const mapped = mapGatePassToDetail(gatePass);
        res.json({ success: true, data: mapped });
      } catch (err) {
        next(err);
      }
    },
  ],

  getByRequestId: [
    authenticate,
    requirePermission('gate-pass', 'view'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const gatePass = await gatePassService.getByRequestId(req.params.requestId);
        const mapped = mapGatePassToDetail(gatePass);
        res.json({ success: true, data: mapped });
      } catch (err) {
        next(err);
      }
    },
  ],

  create: [
    authenticate,
    requirePermission('gate-pass', 'create'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as AuthUser;
        const body = req.body;

        const gatePass = await gatePassService.create({
          requestId: body.requestId,
          purpose: body.purpose,
          items: body.items,
          destination: body.destination,
          expectedReturn: body.expectedReturn ? new Date(body.expectedReturn) : undefined,
          requesterId: user.id,
          departmentId: body.departmentId,
          controlNumber: body.controlNumber,
        });

        await auditService.fromRequest(req, 'create', 'gate_pass', { entityId: gatePass.id });
        res.status(201).json({ success: true, data: gatePass });
      } catch (err) {
        next(err);
      }
    },
  ],

  update: [
    authenticate,
    requirePermission('gate-pass', 'edit'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as AuthUser;
        const body = req.body;

        const gatePass = await gatePassService.update(req.params.id, {
          purpose: body.purpose,
          items: body.items,
          destination: body.destination,
          expectedReturn: body.expectedReturn ? new Date(body.expectedReturn) : undefined,
          actualReturn: body.actualReturn ? new Date(body.actualReturn) : undefined,
          qrCode: body.qrCode,
          securityReleasedBy: body.securityReleasedBy,
          securityReleasedAt: body.securityReleasedAt ? new Date(body.securityReleasedAt) : undefined,
          printCount: body.printCount,
        }, user.id);

        res.json({ success: true, data: gatePass });
      } catch (err) {
        next(err);
      }
    },
  ],

  getStats: [
    authenticate,
    requirePermission('gate-pass', 'view'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { startDate, endDate, departmentId } = req.query as any;
        const stats = await gatePassService.getStats({ startDate, endDate, departmentId });
        res.json({ success: true, data: stats });
      } catch (err) {
        next(err);
      }
    },
  ],

  getActive: [
    authenticate,
    requirePermission('gate-pass', 'view'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const gatePasses = await gatePassService.getActiveGatePasses();
        res.json({ success: true, data: gatePasses });
      } catch (err) {
        next(err);
      }
    },
  ],

  approve: [
    authenticate,
    requirePermission('gate-pass', 'approve'),
    (req: Request, res: Response, next: NextFunction) => {
      upload.single('signature')(req, res, (err: any) => {
        if (err) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new SignatureUploadFailedError('Signature file size exceeds 2MB limit'));
          }
          return next(err);
        }
        next();
      });
    },
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as AuthUser;
        const { requestId, note } = req.body;
        const file = (req as any).file;

        const signature = file ? multerFileToSignature(file) : undefined;

        const gatePass = await gatePassService.approve(requestId, user.id, user.displayName, note, signature);
        res.json({ success: true, data: gatePass, message: 'Gate pass approved successfully' });
      } catch (err) {
        next(err);
      }
    },
  ],

  reject: [
    authenticate,
    requirePermission('gate-pass', 'approve'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as AuthUser;
        const { requestId, reason } = req.body;

        await gatePassService.reject(requestId, user.id, user.displayName, reason);
        res.json({ success: true, message: 'Gate pass rejected successfully' });
      } catch (err) {
        next(err);
      }
    },
  ],

  returnRequest: [
    authenticate,
    requirePermission('gate-pass', 'approve'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as AuthUser;
        const { requestId, note } = req.body;

        await gatePassService.returnRequest(requestId, user.id, user.displayName, note);
        res.json({ success: true, message: 'Gate pass returned for revision' });
      } catch (err) {
        next(err);
      }
    },
  ],

  recordSecurityCheck: [
    authenticate,
    requirePermission('gate-pass', 'edit'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as AuthUser;
        const { requestId, kmReadingStart, timeOut, kmReadingEnd, timeIn, withMeal, mealAmount } = req.body;

        const gatePass = await gatePassService.recordSecurityCheck(requestId, {
          kmReadingStart,
          timeOut: timeOut ? new Date(timeOut) : undefined,
          kmReadingEnd,
          timeIn: timeIn ? new Date(timeIn) : undefined,
          checkedBy: user.id,
          withMeal,
          mealAmount,
        });

        res.json({ success: true, data: gatePass, message: 'Security check recorded' });
      } catch (err) {
        next(err);
      }
    },
  ],

  generateQRCode: [
    authenticate,
    requirePermission('gate-pass', 'view'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const qrCode = await gatePassService.generateQRCode(req.params.requestId);
        res.json({ success: true, data: { qrCode } });
      } catch (err) {
        next(err);
      }
    },
  ],

  getWorkflowStatus: [
    authenticate,
    requirePermission('gate-pass', 'view'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const status = await gatePassService.getWorkflowStatus(req.params.requestId);
        res.json({ success: true, data: status });
      } catch (err) {
        next(err);
      }
    },
  ],

  uploadSignature: [
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      upload.single('signature')(req, res, async (err: any) => {
        if (err) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              message: 'Signature file size exceeds 2MB limit'
            });
          }
          return next(err);
        }

        try {
          const user = req.user as AuthUser;
          const file = req.file;

          if (!file) {
            return res.status(400).json({
              success: false,
              message: 'Signature file is required'
            });
          }

          const result = await gatePassService.uploadSignature(user.id, multerFileToSignature(file));

          res.json({ success: true, data: result, message: 'Signature uploaded successfully' });
        } catch (err) {
          next(err);
        }
      });
    },
  ],

  getUserSignature: [
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as AuthUser;
        const signature = await gatePassService.getUserSignature(user.id);
        res.json({ success: true, data: signature });
      } catch (err) {
        next(err);
      }
    },
  ],

  // Step-specific approval endpoints for HST workflow
  recommend: [
    authenticate,
    requirePermission('gate-pass', 'approve'),
    (req: Request, res: Response, next: NextFunction) => {
      upload.single('signature')(req, res, (err: any) => {
        if (err) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new SignatureUploadFailedError('Signature file size exceeds 2MB limit'));
          }
          return next(err);
        }
        next();
      });
    },
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as AuthUser;
        const requestId = req.params.requestId || req.body.requestId;
        const { note } = req.body;
        const file = (req as any).file;

        const signature = file ? multerFileToSignature(file) : undefined;

        const gatePass = await gatePassService.approveStep(
          requestId,
          user.id,
          user.displayName,
          'recommend',
          note,
          signature
        );
        res.json({ success: true, data: gatePass, message: 'Gate pass recommended successfully' });
      } catch (err) {
        next(err);
      }
    },
  ],

  noted: [
    authenticate,
    requirePermission('gate-pass', 'approve'),
    (req: Request, res: Response, next: NextFunction) => {
      upload.single('signature')(req, res, (err: any) => {
        if (err) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new SignatureUploadFailedError('Signature file size exceeds 2MB limit'));
          }
          return next(err);
        }
        next();
      });
    },
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as AuthUser;
        const requestId = req.params.requestId || req.body.requestId;
        const { note } = req.body;
        const file = (req as any).file;

        const signature = file ? multerFileToSignature(file) : undefined;

        const transportationAssignment = req.body.transportationAssignment
          ? JSON.parse(req.body.transportationAssignment)
          : undefined;

        const gatePass = await gatePassService.approveStep(
          requestId,
          user.id,
          user.displayName,
          'noted',
          note,
          signature,
          transportationAssignment
        );
        res.json({ success: true, data: gatePass, message: 'Gate pass noted successfully' });
      } catch (err) {
        next(err);
      }
    },
  ],

  adminApprove: [
    authenticate,
    requirePermission('gate-pass', 'approve'),
    (req: Request, res: Response, next: NextFunction) => {
      upload.single('signature')(req, res, (err: any) => {
        if (err) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new SignatureUploadFailedError('Signature file size exceeds 2MB limit'));
          }
          return next();
        }
        next();
      });
    },
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as AuthUser;
        const requestId = req.params.requestId || req.body.requestId;
        const { note } = req.body;
        const file = (req as any).file;

        const signature = file ? multerFileToSignature(file) : undefined;

        const gatePass = await gatePassService.approveStep(
          requestId,
          user.id,
          user.displayName,
          'approved_by_admin_manager',
          note,
          signature
        );
        res.json({ success: true, data: gatePass, message: 'Gate pass approved by Admin Manager successfully' });
      } catch (err) {
        next(err);
      }
    },
  ],

  release: [
    authenticate,
    requirePermission('gate-pass', 'edit'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as AuthUser;
        const { requestId, kmReadingStart, kmReadingEnd, withMeal, mealAmount, timeOut, timeIn } = req.body;

        const gatePass = await gatePassService.releaseGatePass(requestId, user.id, user.displayName, {
          kmReadingStart,
          kmReadingEnd,
          withMeal,
          mealAmount,
          timeOut: timeOut ? new Date(timeOut) : new Date(),
          timeIn: timeIn ? new Date(timeIn) : undefined,
        });

        res.json({ success: true, data: gatePass, message: 'Gate pass released successfully' });
      } catch (err) {
        next(err);
      }
    },
  ],

  incrementPrintCount: [
    authenticate,
    requirePermission('gate-pass', 'view'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await gatePassService.incrementPrintCount(req.params.requestId);
        res.json({ success: true, data: result });
      } catch (err) {
        next(err);
      }
    },
  ],

  // QR Code verification endpoints
  verifyQRToken: [
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as AuthUser;
        const { token } = req.params;
        
        const result = await gatePassQRService.verifyQRToken(token, user.id);
        
        // Return the full result structure from the service
        res.json({
          success: result.success,
          data: result.data,
          message: result.data?.message,
          code: result.data?.code
        });
      } catch (err: any) {
        console.error('QR verification error:', err);
        
        // Handle specific error codes from the verification service
        if (err.code === 'ALREADY_RELEASED') {
          return res.status(400).json({ 
            success: false, 
            message: err.message, 
            code: 'ALREADY_RELEASED' 
          });
        }
        if (err.code === 'EXPIRED') {
          return res.status(400).json({ 
            success: false, 
            message: err.message, 
            code: 'EXPIRED' 
          });
        }
        if (err.code === 'NOT_APPROVED') {
          return res.status(400).json({ 
            success: false, 
            message: err.message, 
            code: 'NOT_APPROVED' 
          });
        }
        if (err.message === 'Invalid QR code' || err.message === 'Invalid verification token') {
          return res.status(404).json({ 
            success: false, 
            message: 'Invalid QR Code', 
            code: 'INVALID_TOKEN' 
          });
        }
        
        next(err);
      }
    },
  ],

  confirmQRVerification: [
    authenticate,
    requirePermission('gate-pass', 'edit'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user as AuthUser;
        const { token } = req.params;
        const { kmReadingStart, kmReadingEnd, withMeal, mealAmount, timeOut, timeIn } = req.body;

        const result = await gatePassQRService.confirmVerification(token, user.id, {
          kmReadingStart,
          kmReadingEnd,
          withMeal,
          mealAmount,
          timeOut,
          timeIn,
        });

        res.json({ success: true, data: result.data, message: result.message });
      } catch (err) {
        next(err);
      }
    },
  ],

  getQRScanHistory: [
    authenticate,
    requirePermission('gate-pass', 'view'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const history = await gatePassQRService.getScanHistory(req.params.requestId);
        res.json({ success: true, data: history });
      } catch (err) {
        next(err);
      }
    },
  ],
};
