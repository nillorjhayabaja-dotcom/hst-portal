import { Router } from 'express';
import { dashboardController } from '../../controllers/dashboard.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// All dashboard routes require authentication
router.get('/overview', authenticate, dashboardController.getOverview);
router.get('/metrics', authenticate, dashboardController.getMetrics);
router.get('/charts', authenticate, dashboardController.getCharts);

export default router;
