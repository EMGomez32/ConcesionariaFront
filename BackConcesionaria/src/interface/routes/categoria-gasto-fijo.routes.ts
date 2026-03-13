import { Router } from 'express';
import { CategoriaGastoFijoController } from '../controllers/CategoriaGastoFijoController';

const router = Router();

router.get('/', CategoriaGastoFijoController.getAll);
router.post('/', CategoriaGastoFijoController.create);
router.delete('/:id', CategoriaGastoFijoController.delete);

export default router;
