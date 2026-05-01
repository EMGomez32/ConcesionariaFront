import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { handlers } from './msw-handlers';

/**
 * Setup global de tests.
 *
 * MSW (Mock Service Worker) intercepta requests HTTP de axios/fetch y
 * responde con los handlers de `msw-handlers.ts`. Cada test puede
 * sobreescribir con `server.use(http.get(...))`.
 */
export const server = setupServer(...handlers);

beforeAll(() => {
    // `error` rompe el test si una request no tiene handler — evita falsos
    // positivos donde un test "pasa" porque la API real fallaba silenciosa.
    server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
    cleanup();
    server.resetHandlers();
});

afterAll(() => {
    server.close();
});
