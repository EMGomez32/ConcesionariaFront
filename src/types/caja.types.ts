export type CajaTipo = 'efectivo' | 'mercado_pago' | 'banco' | 'otro';
export type MovimientoTipo = 'ingreso' | 'egreso';
export type MovimientoOrigen = 'manual' | 'venta' | 'gasto' | 'cierre_diferencia' | 'ajuste';

export interface Caja {
    id: number;
    concesionariaId: number;
    nombre: string;
    tipo: CajaTipo;
    moneda: string;
    activo: boolean;
    createdAt?: string;
    updatedAt?: string;
    saldoActual?: number;
}

export interface MovimientoCaja {
    id: number;
    concesionariaId: number;
    cajaId: number;
    tipo: MovimientoTipo;
    fecha: string;
    monto: number | string;
    descripcion?: string | null;
    origen: MovimientoOrigen;
    entidadOrigen?: string | null;
    entidadOrigenId?: number | null;
    registradoPorId?: number | null;
    createdAt?: string;
    caja?: { id: number; nombre: string; tipo: CajaTipo };
}

export interface CierreCaja {
    id: number;
    concesionariaId: number;
    cajaId: number;
    fecha: string;
    saldoInicial: number | string;
    ingresosDia: number | string;
    egresosDia: number | string;
    saldoTeorico: number | string;
    saldoReal?: number | string | null;
    diferencia?: number | string | null;
    observaciones?: string | null;
    cerradoPorId?: number | null;
    createdAt?: string;
    caja?: { id: number; nombre: string; tipo: CajaTipo };
}

export interface CreateCajaDto {
    nombre: string;
    tipo: CajaTipo;
    moneda?: string;
    concesionariaId?: number;
}

export interface CreateMovimientoDto {
    cajaId: number;
    tipo: MovimientoTipo;
    fecha: string;
    monto: number;
    descripcion?: string;
    origen?: MovimientoOrigen;
    concesionariaId?: number;
}

export interface CerrarDiaDto {
    cajaId: number;
    fecha: string;
    saldoReal?: number | null;
    observaciones?: string | null;
    concesionariaId?: number;
}
