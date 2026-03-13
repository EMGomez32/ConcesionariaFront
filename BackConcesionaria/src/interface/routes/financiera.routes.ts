import { Router } from 'express';
import { FinancieraController } from '../controllers/FinancieraController';

const router = Router();

router.get('/', FinancieraController.getAll);
router.get('/:id', FinancieraController.getById);
router.post('/', FinancieraController.create);
router.patch('/:id', FinancieraController.update);
router.delete('/:id', FinancieraController.delete);

export default router;
