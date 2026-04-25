import { Router } from 'express';
import { GastoController } from '../controllers/GastoController';

const router = Router();

router.get('/', GastoController.getAll);
// /total antes de /:id para que Express no tome "total" como id.
router.get('/total', GastoController.total);
router.get('/:id', GastoController.getById);
router.post('/', GastoController.create);
router.patch('/:id', GastoController.update);
router.delete('/:id', GastoController.delete);

export default router;
