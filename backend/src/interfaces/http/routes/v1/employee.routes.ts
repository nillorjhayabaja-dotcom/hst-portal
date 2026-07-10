import { Router } from 'express';
import { employeeController } from '../../controllers/employee.controller';

const router = Router();

router.get('/', ...employeeController.list);
router.get('/:id', ...employeeController.get);
router.post('/', ...employeeController.create);
router.patch('/:id', ...employeeController.update);

export default router;
