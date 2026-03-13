import apiClient from './client';

export type EstadoSolicitud = 'borrador' | 'enviada' | 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada';

export interface SolicitudFinanciacion {
    id: number;
    concesionariaId: number;
    sucursalId?: number;
    ventaId?: number;
    presupuestoId?: number;
    clienteId: number;
    financieraId: number;
    estado: EstadoSolicitud;
    montoSolicitado?: string;
    plazoCuotas?: number;
    tasaEstimada?: string;
    fechaEnvio?: string;
    fechaRespuesta?: string;
    montoAprobado?: string;
    tasaFinal?: string;
    observaciones?: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
    cliente?: { id: number; nombre: string; dni?: string };
    financiera?: { id: number; nombre: string; tipo: string };
    archivos?: SolicitudArchivo[];
}

export interface SolicitudArchivo {
    id: number;
    solicitudId: number;
    tipo?: string;
    url: string;
    descripcion?: string;
    createdAt: string;
}

export interface CreateSolicitudDto {
    clienteId: number;
    financieraId: number;
    ventaId?: number;
    presupuestoId?: number;
    sucursalId?: number;
    montoSolicitado?: number;
    plazoCuotas?: number;
    tasaEstimada?: number;
    observaciones?: string;
}

export interface UpdateSolicitudDto {
    estado?: EstadoSolicitud;
    montoAprobado?: number;
    tasaFinal?: number;
    fechaEnvio?: string;
    fechaRespuesta?: string;
    observaciones?: string;
}

const solicitudesFinanciacionApi = {
    getAll: (params?: Record<string, unknown>, pagination?: { limit?: number; page?: number }) =>
        apiClient.get('/financiacion-solicitudes', { params: { ...params, ...pagination } }),

    getById: (id: number) =>
        apiClient.get(`/financiacion-solicitudes/${id}`),

    create: (data: CreateSolicitudDto) =>
        apiClient.post('/financiacion-solicitudes', data),

    update: (id: number, data: UpdateSolicitudDto) =>
        apiClient.patch(`/financiacion-solicitudes/${id}`, data),

    delete: (id: number) =>
        apiClient.delete(`/financiacion-solicitudes/${id}`),
};

export default solicitudesFinanciacionApi;
