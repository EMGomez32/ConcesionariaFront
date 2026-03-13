import { Router } from 'express';
import { RolController } from '../controllers/RolController';

const router = Router();

router.get('/', RolController.getAll);

export default router;
