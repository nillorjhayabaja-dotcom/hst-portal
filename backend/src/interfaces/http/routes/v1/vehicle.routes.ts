import { Router } from 'express';

const router = Router();

// Vehicle routes - implementation coming in Sprint 13
router.get('/', (req, res) => {
  res.json({ success: true, message: 'Vehicles endpoint', data: [], meta: null, errors: null });
});

router.get('/:id', (req, res) => {
  res.json({ success: true, message: 'Get vehicle endpoint', data: null, meta: null, errors: null });
});

router.post('/', (req, res) => {
  res.json({ success: true, message: 'Create vehicle endpoint', data: null, meta: null, errors: null });
});

router.patch('/:id', (req, res) => {
  res.json({ success: true, message: 'Update vehicle endpoint', data: null, meta: null, errors: null });
});

router.delete('/:id', (req, res) => {
  res.json({ success: true, message: 'Delete vehicle endpoint', data: null, meta: null, errors: null });
});

export default router;