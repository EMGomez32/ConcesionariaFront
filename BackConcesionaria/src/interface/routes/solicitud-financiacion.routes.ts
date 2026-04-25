import { Router } from 'express';
import { SolicitudFinanciacionController } from '../controllers/SolicitudFinanciacionController';
import { uploadSingle } from '../middlewares/upload.middleware';

const router = Router();

router.get('/', SolicitudFinanciacionController.getAll);
router.get('/:id', SolicitudFinanciacionController.getById);
router.post('/', SolicitudFinanciacionController.create);
router.patch('/:id', SolicitudFinanciacionController.update);
router.delete('/:id', SolicitudFinanciacionController.delete);

// Archivos adjuntos
router.get('/:id/archivos', SolicitudFinanciacionController.listArchivos);
router.post('/:id/archivos/upload', uploadSingle, SolicitudFinanciacionController.uploadArchivo);
router.delete('/:id/archivos/:archivoId', SolicitudFinanciacionController.deleteArchivo);

export default router;
