import { IBillingRepository } from '../../../domain/repositories/IBillingRepository';
import { NotFoundException } from '../../../domain/exceptions/BaseException';

// Planes
export class GetPlanes {
    constructor(private readonly repository: IBillingRepository) { }
    async execute(filter?: any) { return this.repository.findAllPlanes(filter); }
}

export class CreatePlan {
    constructor(private readonly repository: IBillingRepository) { }
    async execute(data: any) { return this.repository.createPlan(data); }
}

export class UpdatePlan {
    constructor(private readonly repository: IBillingRepository) { }
    async execute(id: number, data: any) {
        const exists = await this.repository.findPlanById(id);
        if (!exists) throw new NotFoundException('Plan');
        return this.repository.updatePlan(id, data);
    }
}

// Suscripciones
export class GetSubscriptionByConcesionariaId {
    constructor(private readonly repository: IBillingRepository) { }
    async execute(concesionariaId: number) {
        return this.repository.findSubscriptionByConcesionariaId(concesionariaId);
    }
}

export class CreateOrUpdateSubscription {
    constructor(private readonly repository: IBillingRepository) { }
    async execute(concesionariaId: number, data: any) {
        return this.repository.upsertSubscription(concesionariaId, data);
    }
}

// Invoices
export class GetInvoices {
    constructor(private readonly repository: IBillingRepository) { }
    async execute(filter: any = {}, options: any = {}) { return this.repository.findAllInvoices(filter, options); }
}

export class CreateInvoice {
    constructor(private readonly repository: IBillingRepository) { }
    async execute(data: any) { return this.repository.createInvoice(data); }
}

export class GetInvoiceById {
    constructor(private readonly repository: IBillingRepository) { }
    async execute(id: number) {
        const i = await this.repository.findInvoiceById(id);
        if (!i) throw new NotFoundException('Factura');
        return i;
    }
}

// Pagos
export class RegistrarPagoInvoice {
    constructor(private readonly repository: IBillingRepository) { }
    async execute(invoiceId: number, data: any) {
        const invoice = await this.repository.findInvoiceById(invoiceId);
        if (!invoice) throw new NotFoundException('Factura');

        const pago = await this.repository.createPayment({
            invoiceId,
            status: 'succeeded',
            monto: data.monto,
            moneda: data.moneda || invoice.moneda,
            metodo: data.metodo,
            provider: data.provider,
            providerPaymentId: data.providerPaymentId
        });

        const totalPagado = await this.repository.aggregatePaymentsByInvoice(invoiceId);

        if (totalPagado._sum.monto && Number(totalPagado._sum.monto) >= Number(invoice.total)) {
            await this.repository.updateInvoice(invoiceId, { status: 'paid', paidAt: new Date() });
        }

        return pago;
    }
}
