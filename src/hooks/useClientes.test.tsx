import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { server } from '../test/setup';
import { useAuthStore } from '../store/authStore';

const API_BASE = 'http://localhost:3000/api';

const wrapper = ({ children }: { children: ReactNode }) => {
    const qc = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
};

describe('clientesApi / data fetching', () => {
    beforeEach(() => {
        useAuthStore.setState({
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            isAuthenticated: true,
            user: {
                id: 1,
                nombre: 'Admin Test',
                email: 'admin@test.com',
                roles: ['admin'],
                concesionariaId: 1,
                sucursalId: 1,
            },
        });
    });

    it('GET /clientes devuelve lista mockeada', async () => {
        const { clientesApi } = await import('../api/clientes.api');
        const { result } = renderHook(() => clientesApi.getAll({}), { wrapper });

        const response = (await result.current) as { data?: unknown[] };
        expect(response).toBeDefined();
        expect(response.data).toBeDefined();
    });

    it('crea un cliente con POST', async () => {
        // Override del handler default para POST
        server.use(
            http.post(`${API_BASE}/clientes`, async ({ request }) => {
                const body = (await request.json()) as { nombre?: string };
                return HttpResponse.json(
                    {
                        success: true,
                        data: {
                            id: 42,
                            nombre: body?.nombre ?? 'Sin nombre',
                            concesionariaId: 1,
                        },
                    },
                    { status: 201 },
                );
            }),
        );

        const { clientesApi } = await import('../api/clientes.api');
        const created = (await clientesApi.create({ nombre: 'Nuevo Cliente' })) as {
            data?: { id: number; nombre: string };
        };
        await waitFor(() => {
            expect(created?.data?.id).toBe(42);
            expect(created?.data?.nombre).toBe('Nuevo Cliente');
        });
    });

    it('maneja 404 en GET /clientes/:id', async () => {
        server.use(
            http.get(`${API_BASE}/clientes/9999`, () =>
                HttpResponse.json(
                    { error: 'NOT_FOUND', message: 'Cliente no encontrado' },
                    { status: 404 },
                ),
            ),
        );

        const { clientesApi } = await import('../api/clientes.api');
        await expect(clientesApi.getById(9999)).rejects.toBeDefined();
    });
});
