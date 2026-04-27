export interface Rol {
    id: number;
    nombre: string;
}

export type EstadoUsuario = 'pendiente' | 'activo' | 'bloqueado';

export interface Usuario {
    id: number;
    concesionariaId: number | null;
    sucursalId: number | null;
    nombre: string;
    email: string;
    activo: boolean;
    emailVerificado: boolean;
    estado: EstadoUsuario;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    roles: {
        rolId: number;
        rol: Rol;
    }[];
    sucursal?: {
        id: number;
        nombre: string;
        concesionariaId: number;
    } | null;
    concesionaria?: {
        id: number;
        nombre: string;
    } | null;
}

export interface UsuarioFilter {
    nombre?: string;
    email?: string;
    concesionariaId?: number;
    sucursalId?: number;
}

/**
 * El alta YA NO acepta `password` — el usuario lo crea al activar su cuenta
 * vía el email de invitación. El admin solo elige nombre/email/rol/sucursal.
 */
export interface CreateUsuarioDto {
    concesionariaId: number;
    sucursalId?: number;
    nombre: string;
    email: string;
    activo?: boolean;
    roleIds: number[];
}

export type UpdateUsuarioDto = Partial<CreateUsuarioDto> & { password?: string };
