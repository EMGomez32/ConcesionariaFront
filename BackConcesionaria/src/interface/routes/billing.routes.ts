import { Router } from 'express';
import { BillingController } from '../controllers/BillingController';

const router = Router();

// Planes
router.get('/planes', BillingController.getPlanes);
router.post('/planes', BillingController.createPlan);
router.patch('/planes/:id', BillingController.updatePlan);

// Suscripciones
router.get('/subscription', BillingController.getMySubscription);
router.get('/concesionarias/:id/subscription', BillingController.getSubscriptionByConcesionariaId);
router.patch('/concesionarias/:id/subscription', BillingController.updateSubscription);

// Invoices
router.get('/invoices', BillingController.getInvoices);
router.post('/invoices', BillingController.createInvoice);
router.get('/invoices/:id', BillingController.getInvoiceById);
router.post('/invoices/:id/payments', BillingController.registrarPagoInvoice);

export default router;
