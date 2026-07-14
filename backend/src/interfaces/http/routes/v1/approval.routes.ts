import { Router } from 'express';
import { approvalController } from '../../controllers/approval.controller';

const router = Router();

// Approval Request endpoints
router.get('/', ...approvalController.getAll);
router.get('/:id', ...approvalController.getById);
router.get('/pending/:userId', ...approvalController.getPending);
router.get('/mine/:userId', ...approvalController.getMine);

// Approval actions
router.post('/:id/approve', ...approvalController.approve);
router.post('/:id/reject', ...approvalController.reject);
router.post('/:id/return', ...approvalController.returnRequest);
router.post('/:id/delegate', ...approvalController.delegate);
router.post('/:id/recall', ...approvalController.recall);

export default router;
