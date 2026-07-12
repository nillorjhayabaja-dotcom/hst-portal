import { Router } from 'express';
import { gatePassController } from '../../controllers/gate-pass.controller';

const router = Router();

router.post('/submit', ...gatePassController.submit);
router.get('/', ...gatePassController.list);
router.get('/stats', ...gatePassController.getStats);
router.get('/active', ...gatePassController.getActive);
router.get('/request/:requestId', ...gatePassController.getByRequestId);
router.get('/:id', ...gatePassController.get);
router.post('/', ...gatePassController.create);
router.patch('/:id', ...gatePassController.update);
router.post('/:requestId/approve', ...gatePassController.approve);
router.post('/:requestId/reject', ...gatePassController.reject);
router.post('/:requestId/return', ...gatePassController.returnRequest);
router.post('/:requestId/security-check', ...gatePassController.recordSecurityCheck);
router.get('/:requestId/qr-code', ...gatePassController.generateQRCode);
router.get('/:requestId/workflow', ...gatePassController.getWorkflowStatus);
router.post('/signature/upload', ...gatePassController.uploadSignature);
router.get('/signature/my', ...gatePassController.getUserSignature);

// HST Gate Pass step-specific endpoints
router.post('/:requestId/recommend', ...gatePassController.recommend);
router.post('/:requestId/noted', ...gatePassController.noted);
router.post('/:requestId/gado-approve', ...gatePassController.gadoApprove);
router.post('/:requestId/release', ...gatePassController.release);
router.post('/:requestId/print', ...gatePassController.incrementPrintCount);

// QR Code verification endpoints
router.get('/qr/verify/:token', ...gatePassController.verifyQRToken);
router.post('/qr/verify/:token/confirm', ...gatePassController.confirmQRVerification);
router.get('/:requestId/qr/history', ...gatePassController.getQRScanHistory);

export default router;
