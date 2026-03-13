import { Router } from 'express';
import { PostventaItemController } from '../controllers/PostventaItemController';

const router = Router();

router.post('/', PostventaItemController.create);
router.get('/caso/:casoId', PostventaItemController.getByCaso);
router.delete('/:id', PostventaItemController.delete);

export default router;
