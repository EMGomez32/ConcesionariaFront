export class Venta {
    constructor(
        public readonly id: number,
        public readonly concesionariaId: number,
        public readonly sucursalId: number,
        public readonly vehiculoId: number,
        public readonly clienteId: number,
        public readonly vendedorId: number,
        public readonly nroVenta: string,
        public readonly fecha: Date,
        public readonly precioVenta: number,
        public readonly estado: string,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
        public readonly deletedAt: Date | null,
        public readonly cliente?: any,
        public readonly vehiculo?: any,
        public readonly vendedor?: any
    ) { }
}
