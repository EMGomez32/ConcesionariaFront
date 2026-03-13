import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach access token
client.interceptors.request.use(
    (config) => {
        const { accessToken } = useAuthStore.getState();
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handle errors and refresh token
client.interceptors.response.use(
    (response) => response.data, // Return only response.data for easier use
    async (error) => {
        const originalRequest = error.config;

        // If 401 and not already retrying
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const { refreshToken, setAccessToken, logout } = useAuthStore.getState();

            if (refreshToken) {
                try {
                    const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh`, {
                        refreshToken,
                    });

                    // El backend devuelve directamente { access, refresh }
                    const { access } = response.data;
                    setAccessToken(access);

                    // Retry the original request with the new token
                    originalRequest.headers.Authorization = `Bearer ${access}`;
                    return client(originalRequest);
                } catch (refreshError) {
                    logout();
                    window.location.href = '/login';
                    return Promise.reject(refreshError);
                }
            }
        }

        return Promise.reject(error.response?.data || error.message);
    }
);

export default client;
