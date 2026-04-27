import apiClient from './client';

export type EstadoPostventa = 'pendiente' | 'en_curso' | 'resuelto';

export interface PostventaCaso {
    id: number;
    concesionariaId: number;
    sucursalId: number;
    ventaId: number;
    vehiculoId: number;
    clienteId: number;
    fechaReclamo: string;
    tipo?: string;
    descripcion: string;
    estado: EstadoPostventa;
    fechaCierre?: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
    cliente?: { id: number; nombre: string };
    vehiculo?: { id: number; marca: string; modelo: string; dominio?: string };
    sucursal?: { id: number; nombre: string };
    items?: PostventaItem[];
}

export interface PostventaItem {
    id: number;
    casoId: number;
    proveedorId?: number;
    fecha: string;
    descripcion: string;
    monto: string;
    comprobanteUrl?: string;
    createdAt: string;
    proveedor?: { id: number; nombre: string };
}

export interface CreateCasoDto {
    clienteId: number;
    vehiculoId: number;
    sucursalId: number;
    ventaId: number;
    fechaReclamo: string;
    tipo?: string;
    descripcion: string;
}

export interface UpdateCasoDto {
    estado?: EstadoPostventa;
    fechaCierre?: string;
    observaciones?: string;
}

export interface CreateItemDto {
    casoId: number;
    proveedorId?: number;
    fecha: string;
    descripcion: string;
    monto: number;
    comprobanteUrl?: string;
}

export const postventaApi = {
    // Casos
    getCasos: (params?: Record<string, unknown>) =>
        apiClient.get('/postventa-casos', { params }),

    getCasoById: (id: number) =>
        apiClient.get(`/postventa-casos/${id}`),

    createCaso: (data: CreateCasoDto) =>
        apiClient.post('/postventa-casos', data),

    updateCaso: (id: number, data: UpdateCasoDto) =>
        apiClient.patch(`/postventa-casos/${id}`, data),

    deleteCaso: (id: number) =>
        apiClient.delete(`/postventa-casos/${id}`),

    // Items
    getItemsByCaso: (casoId: number) =>
        apiClient.get(`/postventa-items/caso/${casoId}`),

    createItem: (data: CreateItemDto) =>
        apiClient.post('/postventa-items', data),

    deleteItem: (id: number) =>
        apiClient.delete(`/postventa-items/${id}`),
};
