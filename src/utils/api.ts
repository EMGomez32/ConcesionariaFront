/**
 * Normaliza la respuesta del backend a un array de items.
 *
 * El backend devuelve listas en 3 formatos distintos:
 *   1. Array directo:                   `[{...}, {...}]`
 *   2. Paginado:                        `{ results: [...], page, totalPages, ... }`
 *   3. Envuelto con success flag:       `{ success: true, data: [...] }`
 *
 * Este helper se queda con el array sin importar la forma.
 */
export function unwrapList<T>(res: unknown): T[] {
    if (Array.isArray(res)) return res as T[];
    if (res && typeof res === 'object') {
        const o = res as { results?: unknown; data?: unknown };
        if (Array.isArray(o.results)) return o.results as T[];
        if (Array.isArray(o.data)) return o.data as T[];
    }
    return [];
}

/**
 * Normaliza una respuesta paginada.
 * Acepta:
 *   - `{ results, page, totalPages, ... }` (forma directa)
 *   - `{ success, data: { results, ... } }` (envoltorio con cuerpo paginado)
 *   - `{ success, data: [...], meta: { page, totalPages, ... } }` (envoltorio con array + meta)
 */
export interface PagedSlice<T> {
    results: T[];
    page: number;
    limit: number;
    totalPages: number;
    totalResults: number;
}

export function unwrapPaged<T>(res: unknown): PagedSlice<T> {
    const empty: PagedSlice<T> = { results: [], page: 1, limit: 0, totalPages: 0, totalResults: 0 };
    if (!res || typeof res !== 'object') return empty;
    const o = res as Record<string, unknown>;

    // Forma directa: { results, page, ... }
    if (Array.isArray(o.results)) {
        return {
            results: o.results as T[],
            page: typeof o.page === 'number' ? o.page : 1,
            limit: typeof o.limit === 'number' ? o.limit : (o.results as T[]).length,
            totalPages: typeof o.totalPages === 'number' ? o.totalPages : 1,
            totalResults: typeof o.totalResults === 'number' ? o.totalResults : (o.results as T[]).length,
        };
    }

    // Forma envuelta con array y meta paralela: { success, data: [...], meta: {...} }
    if (Array.isArray(o.data)) {
        const meta = (o.meta && typeof o.meta === 'object' ? o.meta : {}) as Record<string, unknown>;
        const arr = o.data as T[];
        return {
            results: arr,
            page: typeof meta.page === 'number' ? meta.page : 1,
            limit: typeof meta.limit === 'number' ? meta.limit : arr.length,
            totalPages: typeof meta.totalPages === 'number' ? meta.totalPages : 1,
            totalResults: typeof meta.totalResults === 'number' ? meta.totalResults : arr.length,
        };
    }

    // Forma envuelta con cuerpo paginado: { success, data: { results, ... } }
    if (o.data && typeof o.data === 'object') {
        return unwrapPaged<T>(o.data);
    }

    return empty;
}
