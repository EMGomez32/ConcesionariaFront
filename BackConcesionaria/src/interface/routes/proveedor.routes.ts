import { Router } from 'express';
import { ProveedorController } from '../controllers/ProveedorController';

const router = Router();

router.get('/', ProveedorController.getAll);
router.get('/:id', ProveedorController.getById);
router.post('/', ProveedorController.create);
router.patch('/:id', ProveedorController.update);
router.delete('/:id', ProveedorController.delete);

export default router;
