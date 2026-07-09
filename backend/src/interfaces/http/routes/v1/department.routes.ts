import { Router } from 'express';
import { departmentController } from '../../controllers/department.controller';

const router = Router();

router.get('/', ...departmentController.list);
router.get('/:id', ...departmentController.get);
router.post('/', ...departmentController.create);
router.patch('/:id', ...departmentController.update);

export default router;