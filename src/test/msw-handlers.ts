import { http, HttpResponse } from 'msw';

/**
 * Handlers de MSW (Mock Service Worker) para tests de hooks/components.
 *
 * Mockean los endpoints del backend con respuestas controladas. Cada test
 * puede sobreescribir handlers específicos con `server.use(...)`.
 *
 * Foundation para tests de hooks de data-fetching que validan:
 *   - useQuery con éxito + isLoading + isSuccess
 *   - error states
 *   - cache invalidation tras mutations
 *   - optimistic updates
 */

const API_BASE = 'http://localhost:3000/api';

export const handlers = [
    // ─── Auth ────────────────────────────────────────────────────────────
    http.post(`${API_BASE}/auth/login`, async ({ request }) => {
        const body = (await request.json()) as { email?: string; password?: string };
        if (body?.email === 'admin@test.com' && body?.password === 'test1234') {
            return HttpResponse.json({
                tokens: {
                    access: 'mock-access-token',
                    refresh: 'mock-refresh-token',
                },
                user: {
                    id: 1,
                    nombre: 'Admin Test',
                    email: 'admin@test.com',
                    roles: ['admin'],
                    concesionariaId: 1,
                    sucursalId: 1,
                },
            });
        }
        return HttpResponse.json(
            { error: 'UNAUTHORIZED', message: 'Credenciales inválidas' },
            { status: 401 },
        );
    }),

    // ─── Vehículos ───────────────────────────────────────────────────────
    http.get(`${API_BASE}/vehiculos`, () => {
        return HttpResponse.json({
            success: true,
            data: [
                {
                    id: 1,
                    marca: 'Toyota',
                    modelo: 'Corolla',
                    estado: 'publicado',
                    precioLista: 15000000,
                    concesionariaId: 1,
                    sucursalId: 1,
                },
            ],
            meta: { page: 1, limit: 20, totalPages: 1, totalResults: 1 },
        });
    }),

    // ─── Ventas ──────────────────────────────────────────────────────────
    http.get(`${API_BASE}/ventas`, () => {
        return HttpResponse.json({
            success: true,
            data: [],
            meta: { page: 1, limit: 20, totalPages: 0, totalResults: 0 },
        });
    }),

    // ─── Clientes ────────────────────────────────────────────────────────
    http.get(`${API_BASE}/clientes`, () => {
        return HttpResponse.json({
            success: true,
            data: [
                { id: 1, nombre: 'Juan Pérez', email: 'juan@test.com', concesionariaId: 1 },
            ],
            meta: { page: 1, limit: 20, totalPages: 1, totalResults: 1 },
        });
    }),
];
