import client from './client';
import type {
    CreateCajaDto, CreateMovimientoDto, CerrarDiaDto,
} from '../types/caja.types';

export interface ListParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export const cajaApi = {
    /** Listado de cajas con saldo actual computado. */
    getCajas: () => client.get('/caja'),
    createCaja: (data: CreateCajaDto) => client.post('/caja', data),
    updateCaja: (id: number, data: Partial<CreateCajaDto> & { activo?: boolean }) =>
        client.patch(`/caja/${id}`, data),
    deleteCaja: (id: number) => client.delete(`/caja/${id}`),

    getMovimientos: (params: ListParams & { cajaId?: number; tipo?: string } = {}) =>
        client.get('/caja/movimientos', { params }),
    createMovimiento: (data: CreateMovimientoDto) => client.post('/caja/movimientos', data),
    deleteMovimiento: (id: number) => client.delete(`/caja/movimientos/${id}`),

    getCierres: (params: ListParams & { cajaId?: number } = {}) =>
        client.get('/caja/cierres', { params }),
    cerrarDia: (data: CerrarDiaDto) => client.post('/caja/cierres', data),
    deleteCierre: (id: number) => client.delete(`/caja/cierres/${id}`),
};
