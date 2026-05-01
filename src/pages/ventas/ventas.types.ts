import type { FormaPagoVenta } from '../../types/venta.types';

/**
 * Types específicos del UI de Ventas. Sprint 4 — extraídos de VentasPage.tsx
 * (799 LOC).
 */

export type MetodoPago = 'efectivo' | 'transferencia' | 'tarjeta' | 'cheque' | 'otro';

export interface PagoRow {
    monto: number;
    metodo: MetodoPago;
    referencia: string;
    observaciones: string;
}

export interface ExtraRow {
    descripcion: string;
    monto: number;
    comprobanteUrl: string;
}

export interface CanjeRow {
    vehiculoCanjeId: number;
    valorTomado: number;
}

export interface VentaForm {
    sucursalId: number;
    clienteId: number;
    vendedorId: number;
    vehiculoId: number;
    fechaVenta: string;
    precioVenta: number;
    moneda: 'ARS' | 'USD';
    formaPago: FormaPagoVenta;
    observaciones: string;
    pagos: PagoRow[];
    externos: ExtraRow[];
    canjes: CanjeRow[];
}

export type BadgeVariant = 'warning' | 'danger' | 'info' | 'success' | 'default';
