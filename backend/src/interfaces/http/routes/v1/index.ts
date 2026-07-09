import { Router } from 'express';
import authRoutes from './auth.routes';
import employeeRoutes from './employee.routes';
import departmentRoutes from './department.routes';
import roleRoutes from './role.routes';
import notificationRoutes from './notification.routes';
import auditRoutes from './audit.routes';
import workflowRoutes from './workflow.routes';
import attachmentRoutes from './attachment.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', time: new Date().toISOString() } });
});

router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/departments', departmentRoutes);
router.use('/roles', roleRoutes);
router.use('/notifications', notificationRoutes);
router.use('/audit', auditRoutes);
router.use('/workflows', workflowRoutes);
router.use('/attachments', attachmentRoutes);

export default router;