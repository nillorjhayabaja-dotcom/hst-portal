import { Router } from 'express';

const router = Router();

// Dashboard routes - implementation coming in Sprint 3
router.get('/overview', (req, res) => {
  res.json({ success: true, message: 'Dashboard overview endpoint', data: null, meta: null, errors: null });
});

router.get('/metrics', (req, res) => {
  res.json({ success: true, message: 'Dashboard metrics endpoint', data: null, meta: null, errors: null });
});

router.get('/charts', (req, res) => {
  res.json({ success: true, message: 'Dashboard charts endpoint', data: null, meta: null, errors: null });
});

export default router;