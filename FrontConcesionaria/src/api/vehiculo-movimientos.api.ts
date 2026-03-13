import client from './client';

export interface VehiculoMovimiento {
    id: number;
    vehiculoId: number;
    desdeSucursalId?: number;
    hastaSucursalId: number;
    tipo: string;
    motivo?: string;
    fechaMovimiento?: string;
    concesionariaId?: number;
    createdAt?: string;
    vehiculo?: { id: number; marca: string; modelo: string; dominio?: string };
    desdeSucursal?: { id: number; nombre: string };
    hastaSucursal?: { id: number; nombre: string };
    registradoPor?: { nombre: string; email: string };
}

export interface MovimientoFilter {
    vehiculoId?: number;
    desdeSucursalId?: number;
    hastaSucursalId?: number;
    page?: number;
    limit?: number;
}

export const vehiculoMovimientosApi = {
    getAll: (filters: MovimientoFilter = {}) =>
        client.get('/vehiculo-movimientos', { params: filters }),

    create: (data: { vehiculoId: number; hastaSucursalId: number; motivo?: string; fechaMovimiento?: string }) =>
        client.post('/vehiculo-movimientos', data),
};
