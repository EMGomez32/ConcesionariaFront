import * as Sentry from '@sentry/react';

/**
 * Sentry para el frontend. Solo activo si VITE_SENTRY_DSN está seteado
 * en build-time (Vite bakea env vars que empiezan con VITE_).
 *
 * Para activar:
 *   1. Crear proyecto React en https://sentry.io
 *   2. Setear VITE_SENTRY_DSN como Build Argument en Coolify/Portainer
 *   3. Rebuildear el front
 */
export const initSentry = () => {
    const dsn = import.meta.env.VITE_SENTRY_DSN;
    if (!dsn) return false;

    Sentry.init({
        dsn,
        environment: import.meta.env.MODE || 'production',
        // Sample rate para performance tracing (0 = desactivado, 1 = todo).
        tracesSampleRate: 0.1,
        // Sample rate para session replay — útil para debug de UX issues.
        // Desactivado por default (consume mucho del free tier).
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 0,
    });

    return true;
};

export { Sentry };
