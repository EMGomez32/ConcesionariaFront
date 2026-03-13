import { Router } from 'express';
import { VehiculoMovimientoController } from '../controllers/VehiculoMovimientoController';

const router = Router();

router.get('/', VehiculoMovimientoController.getAll);
router.post('/', VehiculoMovimientoController.create);

export default router;
