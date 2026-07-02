import { Router } from 'express';
import { RolController } from '../controllers/RolController';
import { authorize } from '../middlewares/authorize.middleware';

const router = Router();

// Listar roles: solo quienes gestionan usuarios (para asignarlos en el alta).
router.get('/', authorize('admin', 'super_admin'), RolController.getAll);

export default router;
