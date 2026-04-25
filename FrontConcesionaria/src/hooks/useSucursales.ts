import { useQuery } from '@tanstack/react-query';
import { sucursalesApi } from '../api/sucursales.api';
import type { Sucursal } from '../types/sucursal.types';

import type { SucursalFilter } from '../types/sucursal.types';
import type { PaginationOptions } from '../types/vehiculo.types';

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
            if (Array.isArray(res)) return res as Sucursal[];
            const paged = res as { results?: Sucursal[] };
            return paged?.results ?? [];
        },
    });
};
