import { Router } from 'express';
import { gatePassCompanionController } from '../../controllers/gate-pass-companion.controller';

const router = Router();

// By gate pass ID
router.get('/:gatePassId/companions', ...gatePassCompanionController.getByGatePassId);
router.post('/:gatePassId/companions', ...gatePassCompanionController.add);
router.post('/:gatePassId/companions/bulk', ...gatePassCompanionController.addBulk);
router.delete('/:gatePassId/companions', ...gatePassCompanionController.clear);

// By request ID
router.get('/request/:requestId/companions', ...gatePassCompanionController.getByRequestId);

// By companion ID
router.delete('/companions/:companionId', ...gatePassCompanionController.remove);
router.patch('/companions/:companionId', ...gatePassCompanionController.update);

export default router;