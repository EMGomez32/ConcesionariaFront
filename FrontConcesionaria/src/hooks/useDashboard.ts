import { useQuery } from '@tanstack/react-query';
import { vehiculosApi } from '../api/vehiculos.api';
import { ventasApi } from '../api/ventas.api';
import { clientesApi } from '../api/clientes.api';
import { reservasApi } from '../api/reservas.api';

export const dashboardKeys = {
    all: ['dashboard'] as const,
    stats: () => [...dashboardKeys.all, 'stats'] as const,
};

export const useDashboardStats = () => {
    return useQuery({
        queryKey: dashboardKeys.stats(),
        queryFn: async () => {
            const [vehiculos, ventas, clientes, reservas] = await Promise.all([
                vehiculosApi.getAll({ estado: 'publicado' }),
                ventasApi.getAll({}),
                clientesApi.getAll({}),
                reservasApi.getAll({ estado: 'activa' })
            ]);

            return {
                vehiculos: vehiculos.data?.data?.totalResults ?? 0,
                ventas: ventas.data?.data?.totalResults ?? 0,
                clientes: clientes.data?.data?.totalResults ?? 0,
                reservas: reservas.data?.data?.totalResults ?? 0,
            };
        },
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
};
