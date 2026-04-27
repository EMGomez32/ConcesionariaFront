import { useQuery } from '@tanstack/react-query';
import { sucursalesApi } from '../api/sucursales.api';
import type { Sucursal, SucursalFilter } from '../types/sucursal.types';
import type { PaginationOptions } from '../types/vehiculo.types';
import { unwrapList } from '../utils/api';

export const sucursalesKeys = {
    all: ['sucursales'] as const,
    lists: () => [...sucursalesKeys.all, 'list'] as const,
    list: (filters: SucursalFilter, options: PaginationOptions) => [...sucursalesKeys.lists(), { filters, options }] as const,
};

export const useSucursales = (filters: SucursalFilter = {}, options: PaginationOptions = {}) => {
    return useQuery<Sucursal[]>({
        queryKey: sucursalesKeys.list(filters, options),
        queryFn: async () => {
            const res = await sucursalesApi.getAll(filters, options);
            // Soporta los 3 shapes del backend: array directo, { results }, { success, data }
            return unwrapList<Sucursal>(res);
        },
    });
};
