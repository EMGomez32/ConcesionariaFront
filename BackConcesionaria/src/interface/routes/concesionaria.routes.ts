import { Router } from 'express';
import { ConcesionariaController } from '../controllers/ConcesionariaController';
import { authenticate } from '../../middlewares/authenticate';

const router = Router();

router.get('/', authenticate, ConcesionariaController.getAll);
router.get('/:id', authenticate, ConcesionariaController.getById);
router.post('/', authenticate, ConcesionariaController.create);
router.patch('/:id', authenticate, ConcesionariaController.update);
router.delete('/:id', authenticate, ConcesionariaController.delete);

export default router;
