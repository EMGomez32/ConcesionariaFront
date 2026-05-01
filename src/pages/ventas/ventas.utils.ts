import type { FormaPagoVenta, EstadoEntrega } from '../../types/venta.types';
import type {
    BadgeVariant,
    CanjeRow,
    PagoRow,
    VentaForm,
} from './ventas.types';

/**
 * Helpers y constantes de Ventas. Sprint 4 — extraídos de VentasPage.tsx.
 */

export const entregaStatusMap: Record<EstadoEntrega, { label: string; variant: BadgeVariant }> = {
    pendiente: { label: 'Pendiente', variant: 'warning' },
    bloqueada: { label: 'Bloqueada', variant: 'danger' },
    autorizada: { label: 'Autorizada', variant: 'info' },
    entregada: { label: 'Entregada', variant: 'success' },
    cancelada: { label: 'Cancelada', variant: 'default' },
};

export const entregaTransitions: Record<EstadoEntrega, { label: string; next: EstadoEntrega }[]> = {
    pendiente: [
        { label: 'Bloquear Entrega', next: 'bloqueada' },
        { label: 'Autorizar Entrega', next: 'autorizada' },
    ],
    bloqueada: [
        { label: 'Autorizar Entrega', next: 'autorizada' },
        { label: 'Anular Operación', next: 'cancelada' },
    ],
    autorizada: [
        { label: 'Efectivizar Entrega', next: 'entregada' },
        { label: 'Anular Operación', next: 'cancelada' },
    ],
    entregada: [],
    cancelada: [],
};

export const formaPagoLabels: Record<FormaPagoVenta, string> = {
    contado: 'Contado / Efectivo',
    transferencia: 'Transferencia Bancaria',
    financiado_propio: 'Financiación Interna',
    financiado_externo: 'Crédito Prendario / Uva',
    canje_mas_diferencia: 'Canje + Saldo',
    mixto: 'Ingresos Mixtos',
};

export const metodoLabels: Record<string, string> = {
    efectivo: 'Efectivo',
    transferencia: 'Transferencia',
    tarjeta: 'Tarjeta',
    cheque: 'Cheque',
    otro: 'Otro / Billetera',
};

/** YYYY-MM-DD del día actual. */
export const today = (): string => new Date().toISOString().split('T')[0];

export const emptyPago = (): PagoRow => ({
    monto: 0,
    metodo: 'efectivo',
    referencia: '',
    observaciones: '',
});

export const emptyCanjeRow = (): CanjeRow => ({
    vehiculoCanjeId: 0,
    valorTomado: 0,
});

export const emptyForm = (): VentaForm => ({
    sucursalId: 0,
    clienteId: 0,
    vendedorId: 0,
    vehiculoId: 0,
    fechaVenta: today(),
    precioVenta: 0,
    moneda: 'ARS',
    formaPago: 'contado',
    observaciones: '',
    pagos: [],
    externos: [],
    canjes: [],
});
