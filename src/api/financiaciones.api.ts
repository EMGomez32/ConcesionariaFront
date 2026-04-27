import client from './client';
import type { PaginationOptions } from '../types/vehiculo.types';

export interface CreateFinanciacionDto {
    ventaId: number;
    clienteId: number;
    cobradorId?: number;
    fechaInicio: string;
    montoFinanciado: number;
    cuotas: number;
    diaVencimiento: number;
    tasaMensual?: number;
    observaciones?: string;
}

export interface PagarCuotaDto {
    monto: number;
    metodo: 'efectivo' | 'transferencia' | 'tarjeta' | 'cheque' | 'otro';
    referencia?: string;
    observaciones?: string;
    fechaPago?: string;
}

export const financiacionesApi = {
    getAll: (filters: Record<string, unknown> = {}, options: PaginationOptions = {}) =>
        client.get('/financiaciones', { params: { ...filters, ...options } }),

    getById: (id: number) =>
        client.get(`/financiaciones/${id}`),

    create: (data: CreateFinanciacionDto) =>
        client.post('/financiaciones', data),

    updateEstado: (id: number, estado: string) =>
        client.patch(`/financiaciones/${id}`, { estado }),

    delete: (id: number) =>
        client.delete(`/financiaciones/${id}`),

    pagarCuota: (cuotaId: number, data: PagarCuotaDto) =>
        client.patch(`/financiaciones/cuotas/${cuotaId}/pagar`, data),
};
