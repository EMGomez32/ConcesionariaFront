import { Router } from 'express';
import { VentaController } from '../controllers/VentaController';

const router = Router();

router.get('/', VentaController.getAll);
router.get('/:id', VentaController.getById);
router.post('/', VentaController.create);
router.patch('/:id', VentaController.update);
router.patch('/:id/estado-entrega', VentaController.changeEstadoEntrega);
router.delete('/:id', VentaController.delete);

// Sub-recursos: pagos
router.get('/:id/pagos', VentaController.listPagos);
router.post('/:id/pagos', VentaController.addPago);
router.delete('/:id/pagos/:pagoId', VentaController.removePago);

// Sub-recursos: extras
router.get('/:id/extras', VentaController.listExtras);
router.post('/:id/extras', VentaController.addExtra);
router.delete('/:id/extras/:extraId', VentaController.removeExtra);

// Sub-recursos: canjes
router.get('/:id/canjes', VentaController.listCanjes);
router.post('/:id/canjes', VentaController.addCanje);
router.delete('/:id/canjes/:canjeId', VentaController.removeCanje);

export default router;
