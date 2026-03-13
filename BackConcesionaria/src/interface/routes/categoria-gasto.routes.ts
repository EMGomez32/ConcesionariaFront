import { Router } from 'express';
import { CategoriaGastoController } from '../controllers/CategoriaGastoController';

const router = Router();

router.get('/', CategoriaGastoController.getAll);
router.post('/', CategoriaGastoController.create);
router.delete('/:id', CategoriaGastoController.delete);

export default router;
