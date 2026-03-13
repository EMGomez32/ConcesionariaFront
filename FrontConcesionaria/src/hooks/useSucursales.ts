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
            console.log('🔍 Fetching sucursales with filters:', filters, 'options:', options);
            const res = await sucursalesApi.getAll(filters, options);
            console.log('📦 Raw response from API:', res);
            
            // La respuesta puede venir en diferentes formatos:
            // 1. {success: true, data: [...], meta: {...}}
            // 2. {results: [...], page: 1, ...}
            // 3. [...] directamente
            
            let data: any;
            
            if ((res as any)?.data) {
                // Formato: {success: true, data: [...], meta: {...}}
                data = (res as any).data;
            } else if ((res as any)?.results) {
                // Formato: {results: [...], page: 1, ...}
                data = (res as any).results;
            } else if (Array.isArray(res)) {
                // Formato: [...] directamente
                data = res;
            } else {
                data = [];
            }
            
            console.log('✅ Extracted data:', data);
            const result = Array.isArray(data) ? data : [];
            console.log('🎯 Final result:', result, 'count:', result.length);
            return result;
        },
    });
};
