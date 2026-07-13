import { Router } from 'express';
import { verificationController } from '../../controllers/verification.controller';

const router = Router();

// Public verification endpoints (no auth required for token validation)
router.get('/verify/:token', ...verificationController.validateToken);
router.get('/verify/:token/status', ...verificationController.getStatus);

// Protected endpoints (require authentication)
router.post('/verify/:token/release', ...verificationController.releaseGatePass);
router.post('/verify/:token/cancel', ...verificationController.cancelVerification);

export default router;