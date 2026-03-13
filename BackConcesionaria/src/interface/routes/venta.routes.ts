import { Router } from 'express';
import { VentaController } from '../controllers/VentaController';

const router = Router();

router.get('/', VentaController.getAll);
router.get('/:id', VentaController.getById);
router.post('/', VentaController.create);
router.delete('/:id', VentaController.delete);

export default router;
