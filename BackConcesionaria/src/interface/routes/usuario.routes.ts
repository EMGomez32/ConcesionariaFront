import { Router } from 'express';
import { UsuarioController } from '../controllers/UsuarioController';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize } from '../middlewares/authorize.middleware';

const router = Router();

router.get('/', authenticate, UsuarioController.getAll);
router.get('/:id', authenticate, UsuarioController.getById);
router.post('/', authenticate, authorize('admin', 'super_admin'), UsuarioController.create);
router.patch('/:id', authenticate, authorize('admin', 'super_admin'), UsuarioController.update);
router.post('/:id/reset-password', authenticate, authorize('admin', 'super_admin'), UsuarioController.resetPassword);
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), UsuarioController.delete);

export default router;
