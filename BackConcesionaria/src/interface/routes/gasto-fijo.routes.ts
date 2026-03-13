import { Router } from 'express';
import { GastoFijoController } from '../controllers/GastoFijoController';

const router = Router();

router.get('/', GastoFijoController.getAll);
router.get('/:id', GastoFijoController.getById);
router.post('/', GastoFijoController.create);
router.patch('/:id', GastoFijoController.update);
router.delete('/:id', GastoFijoController.delete);

export default router;
