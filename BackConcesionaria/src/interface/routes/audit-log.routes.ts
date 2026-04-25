import { Router } from 'express';
import { AuditLogController } from '../controllers/AuditLogController';

const router = Router();

router.get('/', AuditLogController.getAll);
// /export must be defined BEFORE /:id so Express doesn't capture "export" as the id param.
router.get('/export', AuditLogController.exportCsv);
router.get('/:id', AuditLogController.getById);

export default router;
