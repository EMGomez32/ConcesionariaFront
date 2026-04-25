import { Router } from 'express';
import { FinanciacionController } from '../controllers/FinanciacionController';

const router = Router();

router.get('/', FinanciacionController.getAll);
router.get('/:id', FinanciacionController.getById);
router.post('/', FinanciacionController.create);
router.patch('/:id', FinanciacionController.update);
router.delete('/:id', FinanciacionController.delete);
router.patch('/cuotas/:cuotaId/pagar', FinanciacionController.pagarCuota);

export default router;
