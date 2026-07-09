import { Router } from 'express';

const router = Router();

// Comment routes - implementation coming in Sprint 7
router.get('/:entity-type/:entity-id', (req, res) => {
  res.json({ success: true, message: 'Get comments endpoint', data: [], meta: null, errors: null });
});

router.post('/:entity-type/:entity-id', (req, res) => {
  res.json({ success: true, message: 'Create comment endpoint', data: null, meta: null, errors: null });
});

router.patch('/:id', (req, res) => {
  res.json({ success: true, message: 'Update comment endpoint', data: null, meta: null, errors: null });
});

router.delete('/:id', (req, res) => {
  res.json({ success: true, message: 'Delete comment endpoint', data: null, meta: null, errors: null });
});

export default router;