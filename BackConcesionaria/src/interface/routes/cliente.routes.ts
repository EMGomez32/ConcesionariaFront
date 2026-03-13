import { Router } from 'express';
import { ClienteController } from '../controllers/ClienteController';
import { authenticate } from '../middlewares/authenticate.middleware';

const router = Router();

router.get('/', authenticate, ClienteController.getAll);
router.get('/:id', authenticate, ClienteController.getById);
router.post('/', authenticate, ClienteController.create);
router.patch('/:id', authenticate, ClienteController.update);
router.delete('/:id', authenticate, ClienteController.delete);

export default router;
