import { Router } from 'express';
import { positionController } from '../../controllers/position.controller';

const router = Router();

router.get('/', ...positionController.list);
router.get('/:id', ...positionController.get);
router.get('/department/:departmentId', ...positionController.getByDepartment);
router.post('/', ...positionController.create);
router.patch('/:id', ...positionController.update);
router.delete('/:id', ...positionController.delete);

export default router;
