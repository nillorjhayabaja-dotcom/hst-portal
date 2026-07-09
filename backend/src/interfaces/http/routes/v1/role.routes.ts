import { Router } from 'express';
import { roleController } from '../../controllers/role.controller';

const router = Router();

router.get('/', ...roleController.list);
router.get('/:id', ...roleController.get);
router.post('/', ...roleController.create);
router.put('/:id/permissions', ...roleController.setPermissions);
router.get('/:id/permissions', ...roleController.listPermissions);

export default router;