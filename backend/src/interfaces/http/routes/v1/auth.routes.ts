import { Router } from 'express';
import { authController } from '../../controllers/auth.controller';
import { loginRateLimiter } from '../../middleware/rate-limiter';

const router = Router();

router.post('/login', loginRateLimiter, ...authController.login);
router.post('/refresh', ...authController.refresh);
router.post('/logout', ...authController.logout);
router.post('/change-password', ...authController.changePassword);
router.post('/forgot-password', ...authController.forgotPassword);
router.get('/me', ...authController.me);

export default router;
