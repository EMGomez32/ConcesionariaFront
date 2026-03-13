import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postventaApi } from '../api/postventa.api';

export const postventaKeys = {
    all: ['postventa'] as const,
    casos: () => [...postventaKeys.all, 'casos'] as const,
    caso: (id: number) => [...postventaKeys.casos(), id] as const,
};

export const usePostventaCasos = (filters: any = {}) => {
    return useQuery({
        queryKey: [...postventaKeys.casos(), filters],
        queryFn: async () => {
            const res = await postventaApi.getCasos(filters);
            return res as any;
        },
    });
};

export const usePostventaCaso = (id: number) => {
    return useQuery({
        queryKey: postventaKeys.caso(id),
        queryFn: async () => {
            const res = await postventaApi.getCasoById(id);
            return res as any;
        },
        enabled: !!id,
    });
};

export const useCreatePostventaCaso = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => postventaApi.createCaso(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: postventaKeys.casos() });
        },
    });
};

export const useCreatePostventaItem = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => postventaApi.createItem(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: postventaKeys.caso(variables.casoId) });
        },
    });
};
