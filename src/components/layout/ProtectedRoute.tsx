import { useEffect } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const ProtectedRoute = () => {
    const isAuth = useAuthStore((state) => state.isAuthenticated);
    const navigate = useNavigate();

    // El interceptor de axios dispara `auth:expired` cuando el refresh
    // token también falla. Antes hacíamos `window.location.href = '/login'`
    // que provoca full reload + flash blanco. Ahora navegamos via React
    // Router para preservar el estado de la SPA.
    useEffect(() => {
        const onExpired = () => {
            navigate('/login', { replace: true });
        };
        window.addEventListener('auth:expired', onExpired);
        return () => window.removeEventListener('auth:expired', onExpired);
    }, [navigate]);

    if (!isAuth) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
