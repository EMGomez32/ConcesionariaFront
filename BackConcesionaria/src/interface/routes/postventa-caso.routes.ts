import { Router } from 'express';
import { PostventaCasoController } from '../controllers/PostventaCasoController';

const router = Router();

router.get('/', PostventaCasoController.getAll);
router.get('/:id', PostventaCasoController.getById);
router.get('/:id/total', PostventaCasoController.total);
router.post('/', PostventaCasoController.create);
router.patch('/:id', PostventaCasoController.update);
router.delete('/:id', PostventaCasoController.delete);

export default router;
