import { Router } from 'express';
import { VehiculoArchivoController } from '../controllers/VehiculoArchivoController';
import { uploadSingle } from '../middlewares/upload.middleware';

const router = Router();

router.post('/', VehiculoArchivoController.create);
router.post('/upload', uploadSingle, VehiculoArchivoController.upload);
router.get('/vehiculo/:vehiculoId', VehiculoArchivoController.getByVehiculo);
router.delete('/:id', VehiculoArchivoController.delete);

export default router;
