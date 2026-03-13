import { useQuery } from '@tanstack/react-query';
import { auditoriaApi } from '../api/auditoria.api';
import type { PaginationOptions } from '../types/common.types';

export const auditKeys = {
    all: ['audit'] as const,
    lists: () => [...auditKeys.all, 'list'] as const,
    list: (filters: any) => [...auditKeys.lists(), filters] as const,
    details: () => [...auditKeys.all, 'detail'] as const,
    detail: (id: number) => [...auditKeys.details(), id] as const,
};

export const useAuditLogs = (filters: any = {}, options: PaginationOptions = {}) => {
    return useQuery({
        queryKey: auditKeys.list({ ...filters, ...options }),
        queryFn: async () => {
            const res = await auditoriaApi.getAll({ ...filters, ...options });
            return res as any;
        },
    });
};

export const useAuditLog = (id: number) => {
    return useQuery({
        queryKey: auditKeys.detail(id),
        queryFn: async () => {
            const res = await auditoriaApi.getById(id);
            return res as any;
        },
        enabled: !!id,
    });
};
