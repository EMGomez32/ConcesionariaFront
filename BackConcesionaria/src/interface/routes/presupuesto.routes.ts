import { Router } from 'express';
import { PresupuestoController } from '../controllers/PresupuestoController';

const router = Router();

router.get('/', PresupuestoController.getAll);
router.get('/:id', PresupuestoController.getById);
router.post('/', PresupuestoController.create);
router.patch('/:id', PresupuestoController.update);
router.post('/:id/convertir-en-venta', PresupuestoController.convertToVenta);
router.delete('/:id', PresupuestoController.delete);

export default router;
