import { Router } from 'express';
import { userManagementController } from '../../controllers/user-management.controller';

const router = Router();

router.get('/dashboard-summary', ...userManagementController.getDashboardSummary);
router.get('/roles', ...userManagementController.getRoles);
router.get('/departments', ...userManagementController.getDepartments);
router.get('/positions', ...userManagementController.getPositions);
router.get('/', ...userManagementController.getUsers);
router.get('/:id', ...userManagementController.getUserById);
router.post('/', ...userManagementController.createUser);
router.put('/:id', ...userManagementController.updateUser);
router.post('/:id/reset-password', ...userManagementController.resetPassword);
router.post('/:id/toggle-active', ...userManagementController.toggleActive);
router.post('/:id/toggle-lock', ...userManagementController.toggleLock);
router.post('/:id/suspend', ...userManagementController.suspendUser);
router.post('/:id/unsuspend', ...userManagementController.unsuspendUser);
router.post('/:id/force-logout', ...userManagementController.forceLogout);
router.post('/:id/change-role', ...userManagementController.changeUserRole);
router.get('/:id/sessions', ...userManagementController.getUserSessions);
router.get('/:id/login-history', ...userManagementController.getLoginHistory);
router.get('/:id/devices', ...userManagementController.getUserDevices);
router.get('/:id/audit-logs', ...userManagementController.getAuditLogs);
router.delete('/:id', ...userManagementController.deleteUser);
router.post('/:id/change-password', ...userManagementController.changePassword);

export default router;