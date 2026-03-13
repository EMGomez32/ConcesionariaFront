import { Router } from 'express';
import { AuditLogController } from '../controllers/AuditLogController';

const router = Router();

router.get('/', AuditLogController.getAll);
router.get('/:id', AuditLogController.getById);

export default router;
