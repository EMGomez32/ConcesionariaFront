export interface MarcaRef {
    id: number;
    nombre: string;
}

export interface ModeloRef {
    id: number;
    nombre: string;
    marca?: MarcaRef;
}

export interface Marca {
    id: number;
    concesionariaId: number;
    nombre: string;
    activo: boolean;
    createdAt?: string;
    updatedAt?: string;
    _count?: { modelos: number };
}

export interface Modelo {
    id: number;
    concesionariaId: number;
    marcaId: number;
    nombre: string;
    activo: boolean;
    createdAt?: string;
    updatedAt?: string;
    marca?: MarcaRef;
    _count?: { versiones: number };
}

export interface VersionVehiculo {
    id: number;
    concesionariaId: number;
    modeloId: number;
    nombre: string;
    anio?: number | null;
    precioSugerido?: string | number | null;
    activo: boolean;
    createdAt?: string;
    updatedAt?: string;
    modelo?: ModeloRef;
}

export interface CreateMarcaDto {
    nombre: string;
    concesionariaId?: number;
    activo?: boolean;
}

export interface UpdateMarcaDto {
    nombre?: string;
    activo?: boolean;
}

export interface CreateModeloDto {
    nombre: string;
    marcaId: number;
    concesionariaId?: number;
    activo?: boolean;
}

export interface UpdateModeloDto {
    nombre?: string;
    activo?: boolean;
}

export interface CreateVersionDto {
    nombre: string;
    modeloId: number;
    concesionariaId?: number;
    anio?: number | null;
    precioSugerido?: number | null;
    activo?: boolean;
}

export interface UpdateVersionDto {
    nombre?: string;
    anio?: number | null;
    precioSugerido?: number | null;
    activo?: boolean;
}
