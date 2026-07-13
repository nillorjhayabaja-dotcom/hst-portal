import { Router } from 'express';
import { dashboardController } from '../../controllers/dashboard.controller';

const router = Router();

router.get('/overview', dashboardController.getOverview);
router.get('/metrics', dashboardController.getMetrics);
router.get('/charts', dashboardController.getCharts);

export default router;
