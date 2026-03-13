export class VehiculoArchivo {
    constructor(
        public readonly id: number,
        public readonly concesionariaId: number,
        public readonly vehiculoId: number,
        public readonly nombre: string,
        public readonly url: string,
        public readonly tipo: string | null,
        public readonly publicId: string | null,
        public readonly createdAt: Date,
        public readonly updatedAt: Date
    ) { }
}
