import { Router } from 'express';

const router = Router();

// Company routes - implementation coming in Sprint 3
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Company profile endpoint',
    data: null,
    meta: null,
    errors: null,
  });
});

router.patch('/', (req, res) => {
  res.json({
    success: true,
    message: 'Update company profile endpoint',
    data: null,
    meta: null,
    errors: null,
  });
});

export default router;
