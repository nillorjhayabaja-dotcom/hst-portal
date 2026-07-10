import { Router } from 'express';

const router = Router();

// MRF routes - implementation coming in Sprint 10
router.get('/', (req, res) => {
  res.json({ success: true, message: 'MRF requests endpoint', data: [], meta: null, errors: null });
});

router.get('/:id', (req, res) => {
  res.json({
    success: true,
    message: 'Get MRF request endpoint',
    data: null,
    meta: null,
    errors: null,
  });
});

router.post('/', (req, res) => {
  res.json({
    success: true,
    message: 'Create MRF request endpoint',
    data: null,
    meta: null,
    errors: null,
  });
});

router.patch('/:id', (req, res) => {
  res.json({
    success: true,
    message: 'Update MRF request endpoint',
    data: null,
    meta: null,
    errors: null,
  });
});

router.delete('/:id', (req, res) => {
  res.json({
    success: true,
    message: 'Delete MRF request endpoint',
    data: null,
    meta: null,
    errors: null,
  });
});

router.get('/:id/print', (req, res) => {
  res.json({
    success: true,
    message: 'Print MRF request endpoint',
    data: null,
    meta: null,
    errors: null,
  });
});

export default router;
