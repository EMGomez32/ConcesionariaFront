import { IVehiculoArchivoRepository } from '../../../domain/repositories/IVehiculoArchivoRepository';
import { VehiculoArchivo } from '../../../domain/entities/VehiculoArchivo';
import prisma from '../prisma';

export class PrismaVehiculoArchivoRepository implements IVehiculoArchivoRepository {
    async findByVehiculo(vehiculoId: number): Promise<VehiculoArchivo[]> {
        const results = await prisma.vehiculoArchivo.findMany({
            where: { vehiculoId }
        });
        return results.map(this.mapToEntity);
    }

    async findById(id: number): Promise<VehiculoArchivo | null> {
        const a = await prisma.vehiculoArchivo.findUnique({ where: { id } });
        return a ? this.mapToEntity(a) : null;
    }

    async create(data: any): Promise<VehiculoArchivo> {
        const a = await prisma.vehiculoArchivo.create({ data });
        return this.mapToEntity(a);
    }

    async delete(id: number): Promise<void> {
        await prisma.vehiculoArchivo.delete({ where: { id } });
    }

    private mapToEntity(a: any): VehiculoArchivo {
        return new VehiculoArchivo(
            a.id,
            a.concesionariaId,
            a.vehiculoId,
            a.nombre,
            a.url,
            a.tipo,
            a.publicId,
            a.createdAt,
            a.updatedAt
        );
    }
}
