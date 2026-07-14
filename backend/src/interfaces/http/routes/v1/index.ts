import { Router } from 'express';
import authRoutes from './auth.routes';
import employeeRoutes from './employee.routes';
import departmentRoutes from './department.routes';
import positionRoutes from './position.routes';
import roleRoutes from './role.routes';
import gatePassRoutes from './gate-pass.routes';
import qrScannerRoutes from './qr-scanner.routes';
import notificationRoutes from './notification.routes';
import auditRoutes from './audit.routes';
import workflowRoutes from './workflow.routes';
import attachmentRoutes from './attachment.routes';
import commentRoutes from './comment.routes';
import verificationRoutes from './verification.routes';
import approvalRoutes from './approval.routes';
import dashboardRoutes from './dashboard.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', time: new Date().toISOString() } });
});

router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/departments', departmentRoutes);
router.use('/positions', positionRoutes);
router.use('/roles', roleRoutes);
router.use('/gate-pass', gatePassRoutes);
router.use('/qr-scanner', qrScannerRoutes);
router.use('/notifications', notificationRoutes);
router.use('/audit', auditRoutes);
router.use('/workflows', workflowRoutes);
router.use('/attachments', attachmentRoutes);
router.use('/comments', commentRoutes);
router.use('/verification', verificationRoutes);
router.use('/approval-requests', approvalRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
