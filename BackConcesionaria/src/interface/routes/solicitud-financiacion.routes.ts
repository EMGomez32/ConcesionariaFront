import { Router } from 'express';
import { SolicitudFinanciacionController } from '../controllers/SolicitudFinanciacionController';

const router = Router();

router.get('/', SolicitudFinanciacionController.getAll);
router.get('/:id', SolicitudFinanciacionController.getById);
router.post('/', SolicitudFinanciacionController.create);
router.patch('/:id', SolicitudFinanciacionController.update);
router.delete('/:id', SolicitudFinanciacionController.delete);

export default router;
