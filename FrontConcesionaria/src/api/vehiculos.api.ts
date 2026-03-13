import client from './client';
import type { Vehiculo, VehiculoFilter, PaginationOptions, EstadoVehiculo } from '../types/vehiculo.types';
import type { ApiResponse, PaginatedResponse } from '../types/api.types';

export const vehiculosApi = {
    getAll: (filters: VehiculoFilter = {}, options: PaginationOptions = {}) => {
        return client.get<ApiResponse<PaginatedResponse<Vehiculo>>>('/vehiculos', {
            params: { ...filters, ...options },
        });
    },

    getById: (id: number) => {
        return client.get<ApiResponse<Vehiculo>>(`/vehiculos/${id}`);
    },

    create: (data: Partial<Vehiculo>) => {
        return client.post<ApiResponse<Vehiculo>>('/vehiculos', data);
    },

    update: (id: number, data: Partial<Vehiculo>) => {
        return client.patch<ApiResponse<Vehiculo>>(`/vehiculos/${id}`, data);
    },

    changeEstado: (id: number, estado: EstadoVehiculo) => {
        return client.patch<ApiResponse<Vehiculo>>(`/vehiculos/${id}`, { estado });
    },

    transferir: (vehiculoId: number, sucursalDestinoId: number, motivo?: string) => {
        return client.post<ApiResponse<any>>('/vehiculo-movimientos', {
            vehiculoId,
            tipo: 'traslado',
            sucursalDestinoId,
            motivo: motivo || 'Traslado entre sucursales',
            fecha: new Date().toISOString(),
        });
    },

    delete: (id: number) => {
        return client.delete<ApiResponse<void>>(`/vehiculos/${id}`);
    },
};
