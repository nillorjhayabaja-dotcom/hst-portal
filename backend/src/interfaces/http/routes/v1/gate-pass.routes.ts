import { Router } from 'express';
import { gatePassController } from '../../controllers/gate-pass.controller';

const router = Router();

router.get('/dashboard', ...gatePassController.dashboard);
router.get('/', ...gatePassController.list);
router.get('/:id', ...gatePassController.get);
router.post('/', ...gatePassController.create);
router.post('/:id/submit', ...gatePassController.submit);
router.post('/:id/approve', ...gatePassController.approve);
router.post('/:id/reject', ...gatePassController.reject);
router.post('/:id/return', ...gatePassController.returnForRevision);
router.post('/:id/cancel', ...gatePassController.cancel);
router.post('/:id/security-release', ...gatePassController.securityRelease);
router.post('/:id/assign-vehicle', ...gatePassController.assignVehicle);
router.get('/:id/print', ...gatePassController.print);

export default router;
