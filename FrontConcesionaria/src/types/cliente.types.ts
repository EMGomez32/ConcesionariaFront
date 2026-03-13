export interface Cliente {
    id: number;
    concesionariaId: number;
    nombre: string;
    dni?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    observaciones?: string;
    createdAt: string;
    updatedAt: string;
    concesionaria?: {
        id: number;
        nombre: string;
    };
}

export interface ClienteFilter {
    nombre?: string;
    dni?: string;
    telefono?: string;
    concesionariaId?: number;
}
