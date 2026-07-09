import { Router } from 'express';

const router = Router();

// Visitor routes - implementation coming in Sprint 12
router.get('/', (req, res) => {
  res.json({ success: true, message: 'Visitors endpoint', data: [], meta: null, errors: null });
});

router.get('/:id', (req, res) => {
  res.json({ success: true, message: 'Get visitor endpoint', data: null, meta: null, errors: null });
});

router.post('/', (req, res) => {
  res.json({ success: true, message: 'Create visitor endpoint', data: null, meta: null, errors: null });
});

router.patch('/:id', (req, res) => {
  res.json({ success: true, message: 'Update visitor endpoint', data: null, meta: null, errors: null });
});

router.delete('/:id', (req, res) => {
  res.json({ success: true, message: 'Delete visitor endpoint', data: null, meta: null, errors: null });
});

router.get('/:id/print', (req, res) => {
  res.json({ success: true, message: 'Print visitor badge endpoint', data: null, meta: null, errors: null });
});

export default router;