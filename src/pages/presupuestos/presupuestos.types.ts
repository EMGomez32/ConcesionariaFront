import type { Presupuesto } from '../../types/presupuesto.types';

/**
 * Types específicos de la UI de Presupuestos.
 *
 * Sprint 4 — extraídos de PresupuestosPage.tsx (que tenía 1010 LOC y los
 * declaraba inline). El refactor completo a feature-folder sliced design
 * es Sprint 5+; por ahora separamos types + utils para facilitar testing.
 */

export interface PresupuestoItem {
    id: number;
    vehiculoId?: number;
    vehiculo?: { marca: string; modelo: string; dominio?: string; vin?: string };
    precioLista: number | string;
    descuento?: number | string;
    precioFinal: number | string;
}

export interface PresupuestoExtra {
    id?: number;
    descripcion?: string;
    monto: number | string;
}

export interface PresupuestoCanje {
    descripcion?: string;
    anio?: number | string;
    km?: number | string;
    dominio?: string;
    valorTomado: number | string;
    observaciones?: string;
}

export interface PresupuestoRow extends Omit<Presupuesto, 'items'> {
    items?: PresupuestoItem[];
    extras?: PresupuestoExtra[];
    canje?: PresupuestoCanje | null;
    sucursal?: { nombre: string };
    observaciones?: string;
}

export interface ClienteRef {
    id: number;
    nombre: string;
}

export interface SucursalRef {
    id: number;
    nombre: string;
}

export interface VehiculoRef {
    id: number;
    marca: string;
    modelo: string;
    version?: string;
    dominio?: string;
    vin?: string;
}

export interface VendedorRef {
    id: number;
    nombre: string;
}

export type BadgeVariant = 'default' | 'info' | 'success' | 'danger' | 'warning';
