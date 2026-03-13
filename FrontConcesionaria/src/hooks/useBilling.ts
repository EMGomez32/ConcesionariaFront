import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingApi } from '../api/billing.api';
import type { PaginationOptions } from '../types/common.types';

export const billingKeys = {
    all: ['billing'] as const,
    planes: () => [...billingKeys.all, 'planes'] as const,
    subscriptions: () => [...billingKeys.all, 'subscriptions'] as const,
    subscription: (id: number) => [...billingKeys.subscriptions(), id] as const,
    mySubscription: () => [...billingKeys.all, 'my-subscription'] as const,
    invoices: () => [...billingKeys.all, 'invoices'] as const,
    invoice: (id: number) => [...billingKeys.invoices(), id] as const,
};

export const usePlanes = (params?: any) => {
    return useQuery({
        queryKey: [...billingKeys.planes(), params],
        queryFn: async () => {
            const res = await billingApi.getPlanes(params);
            return res as any;
        },
    });
};

export const useSubscriptions = () => {
    return useQuery({
        queryKey: billingKeys.subscriptions(),
        queryFn: async () => {
            const res = await billingApi.getInvoices({ limit: 100 });
            return res as any;
        },
    });
};

export const useUpdateSubscription = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => billingApi.updateSubscription(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: billingKeys.subscriptions() });
        }
    });
};

export const useMySubscription = () => {
    return useQuery({
        queryKey: billingKeys.mySubscription(),
        queryFn: async () => {
            const res = await billingApi.getMySubscription();
            return res as any;
        },
    });
};

export const useInvoices = (filters: any = {}, options: PaginationOptions = {}) => {
    return useQuery({
        queryKey: [...billingKeys.invoices(), { ...filters, ...options }],
        queryFn: async () => {
            const res = await billingApi.getInvoices({ ...filters, ...options });
            return res as any;
        },
    });
};

export const useRegistrarPago = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => billingApi.registrarPago(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: billingKeys.invoices() });
        },
    });
};
