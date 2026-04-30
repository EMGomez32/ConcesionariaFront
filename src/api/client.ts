import axios, {
    AxiosError,
    type AxiosRequestConfig,
    type AxiosResponse,
    type InternalAxiosRequestConfig,
} from 'axios';
import { useAuthStore } from '../store/authStore';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosInstance.interceptors.request.use(
    (config) => {
        const { accessToken } = useAuthStore.getState();
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ─────────────────────────────────────────────────────────────────────────────
// Refresh-on-401 con LOCK para evitar thundering herd.
//
// Antes: 5 queries simultáneas → 401 cada una → 5 calls a /auth/refresh
// (todas con el mismo refreshToken) → en backend, race condition; en front,
// 4 de 5 fallan porque la primera ya rotó el token.
//
// Ahora: el primer 401 dispara UN solo refresh; los siguientes 401 esperan
// la misma promise. Cuando termina, todos retry-ean con el token nuevo.
//
// También cambiamos `window.location.href = '/login'` (que rompe la SPA)
// por `logout()` del store + un evento custom que el ProtectedRoute escucha.
// ─────────────────────────────────────────────────────────────────────────────

let refreshPromise: Promise<string | null> | null = null;

/** Llamado cuando el refresh definitivamente falló — hay que volver al login. */
const dispatchAuthExpired = () => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:expired'));
    }
};

const refreshAccessToken = async (): Promise<string | null> => {
    const { refreshToken, setAccessToken, logout } = useAuthStore.getState();
    if (!refreshToken) return null;

    try {
        const response = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
            { refreshToken }
        );
        const newAccess = response.data?.access ?? response.data?.data?.access;
        if (!newAccess) throw new Error('No access token en la respuesta');
        setAccessToken(newAccess);
        return newAccess;
    } catch (err) {
        logout();
        dispatchAuthExpired();
        return null;
    }
};

axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => response.data,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
            _retry?: boolean;
        };

        // Solo reintentamos UNA vez por request, y solo en 401.
        if (
            error.response?.status === 401 &&
            originalRequest &&
            !originalRequest._retry
        ) {
            originalRequest._retry = true;

            // Si ya hay un refresh en curso, esperamos a ese mismo. Esto es
            // el lock: solo el primer 401 dispara el refresh; los siguientes
            // se cuelgan de la misma promise.
            if (!refreshPromise) {
                refreshPromise = refreshAccessToken().finally(() => {
                    refreshPromise = null;
                });
            }

            const newAccess = await refreshPromise;
            if (!newAccess) {
                return Promise.reject(error.response?.data || error.message);
            }

            originalRequest.headers.Authorization = `Bearer ${newAccess}`;
            return axiosInstance(originalRequest);
        }

        return Promise.reject(error.response?.data || error.message);
    }
);

// The response interceptor unwraps `response.data`, so every call resolves
// to the response body directly. This wrapper aligns the static types with
// that runtime behavior (Promise<T> instead of Promise<AxiosResponse<T>>).
const client = {
    get: <T>(url: string, config?: AxiosRequestConfig) =>
        axiosInstance.get<T, T>(url, config),
    post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
        axiosInstance.post<T, T>(url, data, config),
    patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
        axiosInstance.patch<T, T>(url, data, config),
    put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
        axiosInstance.put<T, T>(url, data, config),
    delete: <T>(url: string, config?: AxiosRequestConfig) =>
        axiosInstance.delete<T, T>(url, config),
};

export default client;
