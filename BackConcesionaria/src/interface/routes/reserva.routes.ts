import { Router } from 'express';
import { ReservaController } from '../controllers/ReservaController';

const router = Router();

router.get('/', ReservaController.getAll);
router.get('/:id', ReservaController.getById);
router.post('/', ReservaController.create);
router.patch('/:id', ReservaController.update);
router.delete('/:id', ReservaController.delete);

export default router;
