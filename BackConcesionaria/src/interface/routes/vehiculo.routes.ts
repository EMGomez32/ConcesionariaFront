import { Router } from 'express';
import { VehiculoController } from '../controllers/VehiculoController';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import * as vehiculoValidation from '../../modules/vehiculos/vehiculo.validation';
import { validate } from '../../middlewares/validate';

const router = Router();

router.get('/', authenticate, VehiculoController.getAll);
router.get('/:id', authenticate, VehiculoController.getById);
router.post('/', authenticate, authorize('admin', 'vendedor'), vehiculoValidation.createVehiculo, validate, VehiculoController.create);
router.patch('/:id', authenticate, authorize('admin', 'vendedor'), vehiculoValidation.updateVehiculo, validate, VehiculoController.update);
router.post('/:id/transferir', authenticate, authorize('admin', 'vendedor'), VehiculoController.transferir);
router.delete('/:id', authenticate, authorize('admin'), VehiculoController.delete);

export default router;
