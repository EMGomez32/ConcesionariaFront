import client from './client';
import type { ConcesionariaFilter, CreateConcesionariaDto, UpdateConcesionariaDto } from '../types/concesionaria.types';
import type { PaginationOptions } from '../types/vehiculo.types';

export const concesionariasApi = {
    getAll: (filters: ConcesionariaFilter = {}, options: PaginationOptions = {}) => {
        return client.get('/concesionarias', {
            params: { ...filters, ...options },
        });
    },

    getById: (id: number) => {
        return client.get(`/concesionarias/${id}`);
    },

    create: (data: CreateConcesionariaDto) => {
        return client.post('/concesionarias', data);
    },

    update: (id: number, data: UpdateConcesionariaDto) => {
        return client.patch(`/concesionarias/${id}`, data);
    },

    delete: (id: number) => {
        return client.delete(`/concesionarias/${id}`);
    },
};
