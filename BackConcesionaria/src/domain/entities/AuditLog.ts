export class AuditLog {
    constructor(
        public readonly id: number,
        public readonly concesionariaId: number,
        public readonly usuarioId: number | null,
        public readonly accion: string,
        public readonly modulo: string,
        public readonly entidadId: number | null,
        public readonly detalleOriginal: any | null,
        public readonly detalleNuevo: any | null,
        public readonly ip: string | null,
        public readonly userAgent: string | null,
        public readonly createdAt: Date,
        public readonly usuario?: any
    ) { }
}
