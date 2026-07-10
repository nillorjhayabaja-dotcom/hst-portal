import { Router } from 'express';

const router = Router();

// Holiday routes - implementation coming in Sprint 3
router.get('/', (req, res) => {
  res.json({ success: true, message: 'Holidays endpoint', data: [], meta: null, errors: null });
});

router.post('/', (req, res) => {
  res.json({
    success: true,
    message: 'Create holiday endpoint',
    data: null,
    meta: null,
    errors: null,
  });
});

router.patch('/:id', (req, res) => {
  res.json({
    success: true,
    message: 'Update holiday endpoint',
    data: null,
    meta: null,
    errors: null,
  });
});

router.delete('/:id', (req, res) => {
  res.json({
    success: true,
    message: 'Delete holiday endpoint',
    data: null,
    meta: null,
    errors: null,
  });
});

router.get('/is-business-day', (req, res) => {
  res.json({
    success: true,
    message: 'Check business day endpoint',
    data: null,
    meta: null,
    errors: null,
  });
});

export default router;
