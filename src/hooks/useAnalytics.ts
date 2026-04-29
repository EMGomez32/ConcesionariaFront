import { useQuery } from '@tanstack/react-query';
import { analyticsApi, type AnalyticsParams } from '../api/analytics.api';

export const analyticsKeys = {
    all: ['analytics'] as const,
    overview: (p: AnalyticsParams) => [...analyticsKeys.all, 'overview', p] as const,
    ventas: (p: AnalyticsParams) => [...analyticsKeys.all, 'ventas', p] as const,
    stock: (p: AnalyticsParams) => [...analyticsKeys.all, 'stock', p] as const,
    financiacion: (p: AnalyticsParams) => [...analyticsKeys.all, 'financiacion', p] as const,
    caja: (p: AnalyticsParams) => [...analyticsKeys.all, 'caja', p] as const,
    gastos: (p: AnalyticsParams) => [...analyticsKeys.all, 'gastos', p] as const,
    postventa: (p: AnalyticsParams) => [...analyticsKeys.all, 'postventa', p] as const,
};

const STALE_5_MIN = 1000 * 60 * 5;

export const useAnalyticsOverview = (params: AnalyticsParams = {}) =>
    useQuery({
        queryKey: analyticsKeys.overview(params),
        queryFn: () => analyticsApi.overview(params),
        staleTime: STALE_5_MIN,
    });

export const useAnalyticsVentas = (params: AnalyticsParams = {}) =>
    useQuery({
        queryKey: analyticsKeys.ventas(params),
        queryFn: () => analyticsApi.ventas(params),
        staleTime: STALE_5_MIN,
    });

export const useAnalyticsStock = (params: AnalyticsParams = {}) =>
    useQuery({
        queryKey: analyticsKeys.stock(params),
        queryFn: () => analyticsApi.stock(params),
        staleTime: STALE_5_MIN,
    });

export const useAnalyticsFinanciacion = (params: AnalyticsParams = {}) =>
    useQuery({
        queryKey: analyticsKeys.financiacion(params),
        queryFn: () => analyticsApi.financiacion(params),
        staleTime: STALE_5_MIN,
    });

export const useAnalyticsCaja = (params: AnalyticsParams = {}) =>
    useQuery({
        queryKey: analyticsKeys.caja(params),
        queryFn: () => analyticsApi.caja(params),
        staleTime: STALE_5_MIN,
    });

export const useAnalyticsGastos = (params: AnalyticsParams = {}) =>
    useQuery({
        queryKey: analyticsKeys.gastos(params),
        queryFn: () => analyticsApi.gastos(params),
        staleTime: STALE_5_MIN,
    });

export const useAnalyticsPostventa = (params: AnalyticsParams = {}) =>
    useQuery({
        queryKey: analyticsKeys.postventa(params),
        queryFn: () => analyticsApi.postventa(params),
        staleTime: STALE_5_MIN,
    });
