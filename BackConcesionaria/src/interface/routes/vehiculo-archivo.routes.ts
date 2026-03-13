import { Router } from 'express';
import { VehiculoArchivoController } from '../controllers/VehiculoArchivoController';

const router = Router();

router.post('/', VehiculoArchivoController.create);
router.get('/vehiculo/:vehiculoId', VehiculoArchivoController.getByVehiculo);
router.delete('/:id', VehiculoArchivoController.delete);

export default router;
