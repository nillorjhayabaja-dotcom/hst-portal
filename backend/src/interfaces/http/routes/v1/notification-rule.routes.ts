import { Router } from 'express';

const router = Router();

// Notification rule routes - implementation coming in Sprint 6
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Notification rules endpoint',
    data: [],
    meta: null,
    errors: null,
  });
});

router.post('/', (req, res) => {
  res.json({
    success: true,
    message: 'Create notification rule endpoint',
    data: null,
    meta: null,
    errors: null,
  });
});

router.patch('/:id', (req, res) => {
  res.json({
    success: true,
    message: 'Update notification rule endpoint',
    data: null,
    meta: null,
    errors: null,
  });
});

router.delete('/:id', (req, res) => {
  res.json({
    success: true,
    message: 'Delete notification rule endpoint',
    data: null,
    meta: null,
    errors: null,
  });
});

export default router;
