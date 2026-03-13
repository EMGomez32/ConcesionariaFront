import client from './client';
import type { Proveedor, ProveedorFilter } from '../types/proveedor.types';
import type { ApiResponse, PaginatedResponse } from '../types/api.types';

export const proveedoresApi = {
    getAll: (filters: ProveedorFilter = {}, options: any = {}) => {
        return client.get<ApiResponse<PaginatedResponse<Proveedor>>>('/proveedores', {
            params: { ...filters, ...options }
        });
    },

    getById: (id: number) => {
        return client.get<ApiResponse<Proveedor>>(`/proveedores/${id}`);
    },

    create: (data: Partial<Proveedor>) => {
        return client.post<ApiResponse<Proveedor>>('/proveedores', data);
    },

    update: (id: number, data: Partial<Proveedor>) => {
        return client.patch<ApiResponse<Proveedor>>(`/proveedores/${id}`, data);
    },

    delete: (id: number) => {
        return client.delete<ApiResponse<void>>(`/proveedores/${id}`);
    },
};
