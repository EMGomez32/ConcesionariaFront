import { Router } from 'express';
import { GastoController } from '../controllers/GastoController';

const router = Router();

router.get('/', GastoController.getAll);
router.get('/:id', GastoController.getById);
router.post('/', GastoController.create);
router.patch('/:id', GastoController.update);
router.delete('/:id', GastoController.delete);

export default router;
