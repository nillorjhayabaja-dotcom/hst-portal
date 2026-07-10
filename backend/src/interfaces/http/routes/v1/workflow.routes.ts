import { Router } from 'express';
import { workflowController } from '../../controllers/workflow.controller';

const router = Router();

router.get('/', ...workflowController.list);
router.get('/:id', ...workflowController.get);
router.post('/', ...workflowController.create);

export default router;
