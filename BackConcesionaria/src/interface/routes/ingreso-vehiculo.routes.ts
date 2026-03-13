import { Router } from 'express';
import { IngresoVehiculoController } from '../controllers/IngresoVehiculoController';

const router = Router();

router.get('/', IngresoVehiculoController.getAll);
router.get('/:id', IngresoVehiculoController.getById);
router.post('/', IngresoVehiculoController.create);
router.delete('/:id', IngresoVehiculoController.delete);

export default router;
