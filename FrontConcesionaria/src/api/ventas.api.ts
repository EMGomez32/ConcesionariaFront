import client from './client';
import type { Venta } from '../types/venta.types';
import type { PaginationOptions } from '../types/vehiculo.types';
import type { ApiResponse, PaginatedResponse } from '../types/api.types';

export interface CreateVentaDto {
    sucursalId: number;
    clienteId: number;
    vendedorId: number;
    vehiculoId: number;
    presupuestoId?: number;
    reservaId?: number;
    precioVenta: number;
    moneda: 'ARS' | 'USD';
    formaPago: 'contado' | 'transferencia' | 'financiado_propio' | 'financiado_externo' | 'canje_mas_diferencia' | 'mixto';
    fechaVenta: string;
    observaciones?: string;
    pagos?: { monto: number; metodo: 'efectivo' | 'transferencia' | 'tarjeta' | 'cheque' | 'otro'; referencia?: string; observaciones?: string }[];
    externos?: { descripcion: string; monto: number; comprobanteUrl?: string }[];
    canjes?: { vehiculoCanjeId: number; valorTomado: number }[];
}

export interface VentaFilters {
    sucursalId?: number;
    clienteId?: number;
    vendedorId?: number;
    vehiculoId?: number;
    estadoEntrega?: string;
    formaPago?: string;
    fechaDesde?: string;
    fechaHasta?: string;
}

export const ventasApi = {
    getAll: (filters: VentaFilters = {}, options: PaginationOptions = {}) => {
        return client.get<ApiResponse<PaginatedResponse<Venta>>>('/ventas', {
            params: { ...filters, ...options },
        });
    },

    getById: (id: number) => {
        return client.get<ApiResponse<Venta>>(`/ventas/${id}`);
    },

    create: (data: CreateVentaDto) => {
        return client.post<ApiResponse<Venta>>('/ventas', data);
    },

    update: (id: number, data: { estadoEntrega?: string; observaciones?: string }) => {
        return client.patch<ApiResponse<Venta>>(`/ventas/${id}`, data);
    },

    delete: (id: number) => {
        return client.delete<ApiResponse<void>>(`/ventas/${id}`);
    },
};
