import { Router } from 'express';
import { BillingController } from '../controllers/BillingController';
import { authorize } from '../middlewares/authorize.middleware';

const router = Router();

// Autenticación global ya aplicada en routes/index.ts.
// La GESTIÓN de billing (planes, suscripciones de cualquier tenant, facturación)
// es exclusiva de super_admin (dueño del SaaS).

// Planes
router.get('/planes', BillingController.getPlanes); // cualquier autenticado puede ver los planes disponibles
router.post('/planes', authorize('super_admin'), BillingController.createPlan);
router.patch('/planes/:id', authorize('super_admin'), BillingController.updatePlan);

// Suscripciones
router.get('/subscription', BillingController.getMySubscription); // la del propio tenant (scopeada por contexto)
router.get('/concesionarias/:id/subscription', authorize('super_admin'), BillingController.getSubscriptionByConcesionariaId);
router.patch('/concesionarias/:id/subscription', authorize('super_admin'), BillingController.updateSubscription);

// Invoices (facturación del SaaS a las concesionarias)
router.get('/invoices', authorize('super_admin'), BillingController.getInvoices);
router.post('/invoices', authorize('super_admin'), BillingController.createInvoice);
router.get('/invoices/:id', authorize('super_admin'), BillingController.getInvoiceById);
router.post('/invoices/:id/payments', authorize('super_admin'), BillingController.registrarPagoInvoice);

export default router;
