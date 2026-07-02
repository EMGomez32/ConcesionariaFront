import { Router } from 'express';
import { ConcesionariaController } from '../controllers/ConcesionariaController';
import { authorize } from '../middlewares/authorize.middleware';

const router = Router();

// La autenticación global (routes/index.ts) ya exige JWT en todas estas rutas.
// La GESTIÓN de concesionarias (tenants) es exclusiva de super_admin (dueño del SaaS).
router.get('/', authorize('super_admin'), ConcesionariaController.getAll);
// TODO (E1-xx): scopear GET /:id a la concesionaria propia del usuario (página de configuración),
// ya que Concesionaria es un modelo global y hoy cualquier autenticado puede leer otra por id.
router.get('/:id', ConcesionariaController.getById);
router.post('/', authorize('super_admin'), ConcesionariaController.create);
router.patch('/:id', authorize('super_admin'), ConcesionariaController.update);
router.delete('/:id', authorize('super_admin'), ConcesionariaController.delete);

export default router;
