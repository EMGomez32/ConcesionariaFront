export type TipoVehiculo = 'USADO' | 'CERO_KM';
export type OrigenVehiculo = 'compra' | 'permuta' | 'consignacion' | 'otro';
export type EstadoVehiculo = 'preparacion' | 'publicado' | 'reservado' | 'vendido' | 'devuelto';

export interface Vehiculo {
    id: number;
    concesionariaId: number;
    sucursalId: number;
    tipo: TipoVehiculo;
    origen: OrigenVehiculo;
    marca: string;
    modelo: string;
    version?: string;
    marcaId?: number | null;
    modeloId?: number | null;
    versionVehiculoId?: number | null;
    anio?: number;
    dominio?: string;
    vin?: string;
    kmIngreso?: number;
    color?: string;
    estado: EstadoVehiculo;
    fechaIngreso: string;
    fechaCompra?: string;
    precioCompra?: number;
    precioLista?: number;
    proveedorCompraId?: number;
    formaPagoCompra?: string;
    observaciones?: string;
    createdAt: string;
    updatedAt: string;

    // Relaciones (opcionales según el endpoint)
    sucursal?: { id: number; nombre: string };
    archivos?: unknown[];
    marcaCatalogo?: { id: number; nombre: string } | null;
    modeloCatalogo?: { id: number; nombre: string } | null;
    versionCatalogo?: { id: number; nombre: string; anio?: number | null; precioSugerido?: string | number | null } | null;
}

export interface VehiculoFilter {
    marca?: string;
    modelo?: string;
    estado?: EstadoVehiculo;
    tipo?: TipoVehiculo;
    dominio?: string;
    sucursalId?: number;
}

export interface PaginationOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
