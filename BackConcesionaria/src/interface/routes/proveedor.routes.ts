import { Router } from 'express';
import { ProveedorController } from '../controllers/ProveedorController';

const router = Router();

router.get('/', ProveedorController.getAll);
router.post('/', ProveedorController.create);

export default router;
