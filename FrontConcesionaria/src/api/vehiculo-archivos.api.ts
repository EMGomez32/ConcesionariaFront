import client from './client';

export interface VehiculoArchivo {
    id: number;
    vehiculoId: number;
    url: string;
    nombre: string;
    tipo?: string;
    orden?: number;
    descripcion?: string;
    createdAt?: string;
}

export interface CreateArchivoDto {
    vehiculoId: number;
    url: string;
    nombre: string;
    tipo?: string;
    orden?: number;
    descripcion?: string;
}

export const vehiculoArchivosApi = {
    getByVehiculo: (vehiculoId: number) =>
        client.get<VehiculoArchivo[]>(`/vehiculo-archivos/vehiculo/${vehiculoId}`),

    create: (data: CreateArchivoDto) =>
        client.post<VehiculoArchivo>('/vehiculo-archivos', data),

    delete: (id: number) =>
        client.delete(`/vehiculo-archivos/${id}`),
};
