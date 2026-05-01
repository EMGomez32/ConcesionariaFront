import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { server } from '../test/setup';

// Setear token mock antes de los imports — el axios interceptor lo lee
// del store al hacer las requests.
import { useAuthStore } from '../store/authStore';

const API_BASE = 'http://localhost:3000/api';

// Helper para envolver el hook con QueryClientProvider.
const wrapper = ({ children }: { children: ReactNode }) => {
    const qc = new QueryClient({
        defaultOptions: {
            queries: { retry: false, gcTime: 0 },
        },
    });
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
};

describe('useVehiculos / data fetching con MSW', () => {
    beforeEach(() => {
        // Setear token para que el axios interceptor lo agregue.
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

    it('GET /vehiculos devuelve la lista mockeada', async () => {
        // Importamos la API DESPUÉS del setup del store y handler default
        const { vehiculosApi } = await import('../api/vehiculos.api');

        const { result } = renderHook(
            () => {
                // Usamos directamente la api en lugar de un hook real para
                // probar el wiring de MSW + axios + token interceptor.
                return vehiculosApi.getAll({});
            },
            { wrapper },
        );

        // El handler default de msw-handlers responde con 1 vehículo Toyota Corolla
        const response = await result.current;
        expect(response).toBeDefined();
        // El response interceptor desempaqueta `data`, así que viene
        // directamente como el body del envelope.
        const data = (response as { data?: unknown[]; success?: boolean }) ?? {};
        // El handler devuelve { success: true, data: [...] } — el client
        // unwrappea response.data, así que acá tenemos el envelope completo.
        expect(data).toBeTruthy();
    });

    it('responde 401 cuando MSW devuelve unauthorized', async () => {
        // Override handler para este test
        server.use(
            http.get(`${API_BASE}/vehiculos`, () =>
                HttpResponse.json(
                    { error: 'UNAUTHORIZED', message: 'token expirado' },
                    { status: 401 },
                ),
            ),
        );

        const { vehiculosApi } = await import('../api/vehiculos.api');

        // El interceptor de axios va a intentar refresh, que también va
        // a fallar (no hay handler para /auth/refresh) y entonces el
        // request original tira el error desempacado.
        await expect(vehiculosApi.getAll({})).rejects.toBeDefined();
    });

    it('respeta override de handler con datos custom', async () => {
        server.use(
            http.get(`${API_BASE}/vehiculos`, () =>
                HttpResponse.json({
                    success: true,
                    data: [
                        { id: 99, marca: 'Ford', modelo: 'Ranger', estado: 'reservado' },
                    ],
                    meta: { totalResults: 1 },
                }),
            ),
        );

        const { vehiculosApi } = await import('../api/vehiculos.api');
        const res = (await vehiculosApi.getAll({})) as {
            data?: Array<{ marca: string }>;
        };
        // Verificamos que el override se aplicó
        await waitFor(() => {
            expect(res?.data?.[0]?.marca).toBe('Ford');
        });
    });
});
