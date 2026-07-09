import { Router } from 'express';

const router = Router();

// Setting routes - implementation coming in Sprint 3
router.get('/', (req, res) => {
  res.json({ success: true, message: 'Settings endpoint', data: [], meta: null, errors: null });
});

router.get('/:category', (req, res) => {
  res.json({ success: true, message: 'Settings by category endpoint', data: null, meta: null, errors: null });
});

router.patch('/:key', (req, res) => {
  res.json({ success: true, message: 'Update setting endpoint', data: null, meta: null, errors: null });
});

export default router;