import type { EstadoPresupuesto } from '../../types/presupuesto.types';
import type { FormaPagoVenta } from '../../types/venta.types';
import type { BadgeVariant } from './presupuestos.types';

/**
 * Helpers y constantes específicas de Presupuestos.
 *
 * Sprint 4 — extraídos de PresupuestosPage.tsx para reducir su tamaño y
 * facilitar testing/reutilización.
 */

export const FORMA_PAGO_OPTIONS_CONV: { value: FormaPagoVenta; label: string }[] = [
    { value: 'contado', label: 'Contado / Efectivo' },
    { value: 'transferencia', label: 'Transferencia Bancaria' },
    { value: 'financiado_propio', label: 'Financiación Interna' },
    { value: 'financiado_externo', label: 'Crédito Prendario / UVA' },
    { value: 'canje_mas_diferencia', label: 'Canje + Saldo' },
    { value: 'mixto', label: 'Pago Mixto' },
];

/** YYYY-MM-DD del día actual. */
export const today = () => new Date().toISOString().slice(0, 10);

/** Genera un número de presupuesto único basado en fecha + epoch. */
export const genNro = () => {
    const d = new Date();
    return `P-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getTime()).slice(-4)}`;
};

/** Formatea fecha ISO a `dd/mm/yyyy`. Devuelve `-` si null/undefined. */
export const fmt = (v: string | null | undefined) =>
    v ? new Date(v).toLocaleDateString('es-AR') : '-';

/** Formatea número como currency argentino. */
export const currencyFmt = (v: number | string, moneda = 'ARS') =>
    new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: moneda,
        maximumFractionDigits: 0,
    }).format(Number(v));

export const STATUS: Record<EstadoPresupuesto, { label: string; variant: BadgeVariant }> = {
    borrador: { label: 'Borrador', variant: 'default' },
    enviado: { label: 'Enviado', variant: 'info' },
    aceptado: { label: 'Aceptado', variant: 'success' },
    rechazado: { label: 'Rechazado', variant: 'danger' },
    vencido: { label: 'Vencido', variant: 'warning' },
    cancelado: { label: 'Cancelado', variant: 'default' },
};

/** Item vacío para el form de creación (un vehículo más). */
export const emptyItem = () => ({
    vehiculoId: '',
    precioLista: '',
    descuento: '0',
    precioFinal: '',
});

/** Canje vacío. */
export const emptyCanje = () => ({
    descripcion: '',
    anio: '',
    km: '',
    dominio: '',
    valorTomado: '',
    observaciones: '',
});

/** Estado inicial del form de creación. */
export const blankForm = () => ({
    nroPresupuesto: genNro(),
    sucursalId: '',
    clienteId: '',
    vendedorId: '',
    moneda: 'ARS' as 'ARS' | 'USD',
    fechaCreacion: today(),
    validoHasta: '',
    observaciones: '',
    items: [emptyItem()],
    extras: [] as { descripcion: string; monto: string }[],
    conCanje: false,
    canje: emptyCanje(),
});
