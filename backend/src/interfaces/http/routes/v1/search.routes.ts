import { Router } from 'express';

const router = Router();

// Search routes - implementation coming in Sprint 3
router.get('/', (req, res) => {
  res.json({ success: true, message: 'Global search endpoint', data: [], meta: null, errors: null });
});

export default router;