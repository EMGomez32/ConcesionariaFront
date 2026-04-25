import client from './client';
import type { Vehiculo, VehiculoFilter, PaginationOptions, EstadoVehiculo } from '../types/vehiculo.types';
import type { PaginatedResponse } from '../types/api.types';

export const vehiculosApi = {
    getAll: (filters: VehiculoFilter = {}, options: PaginationOptions = {}) => {
        return client.get<PaginatedResponse<Vehiculo>>('/vehiculos', {
            params: { ...filters, ...options },
        });
    },

    getById: (id: number) => {
        return client.get<Vehiculo>(`/vehiculos/${id}`);
    },

    create: (data: Partial<Vehiculo>) => {
        return client.post<Vehiculo>('/vehiculos', data);
    },

    update: (id: number, data: Partial<Vehiculo>) => {
        return client.patch<Vehiculo>(`/vehiculos/${id}`, data);
    },

    changeEstado: (id: number, estado: EstadoVehiculo) => {
        return client.patch<Vehiculo>(`/vehiculos/${id}`, { estado });
    },

    transferir: (vehiculoId: number, sucursalDestinoId: number, motivo?: string) => {
        return client.post<unknown>('/vehiculo-movimientos', {
            vehiculoId,
            tipo: 'traslado',
            sucursalDestinoId,
            motivo: motivo || 'Traslado entre sucursales',
            fecha: new Date().toISOString(),
        });
    },

    delete: (id: number) => {
        return client.delete<void>(`/vehiculos/${id}`);
    },
};
