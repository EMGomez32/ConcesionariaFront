import client from './client';
import type { ApiResponse, PaginatedResponse } from '../types/api.types';

export interface GastoCategoria {
    id: number;
    nombre: string;
    descripcion?: string;
    activo?: boolean;
    concesionariaId?: number;
    createdAt?: string;
}

export const gastosCategoriaApi = {
    getAll: (params?: { activo?: boolean }) =>
        client.get<ApiResponse<PaginatedResponse<GastoCategoria> | GastoCategoria[]>>('/gastos-categorias', { params }),

    create: (data: { nombre: string; descripcion?: string }) =>
        client.post<ApiResponse<GastoCategoria>>('/gastos-categorias', data),

    update: (id: number, data: { nombre?: string; descripcion?: string }) =>
        client.patch<ApiResponse<GastoCategoria>>(`/gastos-categorias/${id}`, data),

    delete: (id: number) =>
        client.delete<ApiResponse<void>>(`/gastos-categorias/${id}`),
};
