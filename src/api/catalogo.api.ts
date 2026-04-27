import client from './client';
import type {
    CreateMarcaDto, UpdateMarcaDto,
    CreateModeloDto, UpdateModeloDto,
    CreateVersionDto, UpdateVersionDto,
} from '../types/catalogo.types';

export interface CatalogoListParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    nombre?: string;
    concesionariaId?: number;
}

export const marcasApi = {
    getAll: (params: CatalogoListParams = {}) =>
        client.get('/marcas', { params }),
    getById: (id: number) =>
        client.get(`/marcas/${id}`),
    create: (data: CreateMarcaDto) =>
        client.post('/marcas', data),
    update: (id: number, data: UpdateMarcaDto) =>
        client.patch(`/marcas/${id}`, data),
    delete: (id: number) =>
        client.delete(`/marcas/${id}`),
};

export interface ModeloListParams extends CatalogoListParams {
    marcaId?: number;
}

export const modelosApi = {
    getAll: (params: ModeloListParams = {}) =>
        client.get('/modelos', { params }),
    getById: (id: number) =>
        client.get(`/modelos/${id}`),
    create: (data: CreateModeloDto) =>
        client.post('/modelos', data),
    update: (id: number, data: UpdateModeloDto) =>
        client.patch(`/modelos/${id}`, data),
    delete: (id: number) =>
        client.delete(`/modelos/${id}`),
};

export interface VersionListParams extends CatalogoListParams {
    modeloId?: number;
    anio?: number;
}

export const versionesApi = {
    getAll: (params: VersionListParams = {}) =>
        client.get('/versiones', { params }),
    getById: (id: number) =>
        client.get(`/versiones/${id}`),
    create: (data: CreateVersionDto) =>
        client.post('/versiones', data),
    update: (id: number, data: UpdateVersionDto) =>
        client.patch(`/versiones/${id}`, data),
    delete: (id: number) =>
        client.delete(`/versiones/${id}`),
};
