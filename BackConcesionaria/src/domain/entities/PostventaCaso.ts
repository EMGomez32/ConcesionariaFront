export class PostventaCaso {
    constructor(
        public readonly id: number,
        public readonly concesionariaId: number,
        public readonly sucursalId: number,
        public readonly clienteId: number,
        public readonly vehiculoId: number | null,
        public readonly nroCaso: string,
        public readonly fechaApertura: Date,
        public readonly fechaCierre: Date | null,
        public readonly motivo: string,
        public readonly estado: string,
        public readonly prioridad: string,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
        public readonly deletedAt: Date | null,
        public readonly cliente?: any,
        public readonly vehiculo?: any,
        public readonly items?: any[]
    ) { }
}
