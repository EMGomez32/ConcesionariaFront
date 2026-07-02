import { IVehiculoArchivoRepository } from '../../../domain/repositories/IVehiculoArchivoRepository';
import { VehiculoArchivo } from '../../../domain/entities/VehiculoArchivo';
import { NotFoundException } from '../../../domain/exceptions/BaseException';
import prisma from '../prisma';
import { context } from '../../security/context';

export class PrismaVehiculoArchivoRepository implements IVehiculoArchivoRepository {
    // VehiculoArchivo NO tiene concesionariaId propio: se aísla por el vehículo padre.
    private vehiculoScope(): any {
        const tenantId = context.getTenantId();
        return context.isSuperAdmin() ? {} : { vehiculo: { concesionariaId: tenantId } };
    }

    async findByVehiculo(vehiculoId: number): Promise<VehiculoArchivo[]> {
        const where: any = { vehiculoId, ...this.vehiculoScope() };
        const results = await prisma.vehiculoArchivo.findMany({ where });
        return results.map(this.mapToEntity);
    }

    async findById(id: number): Promise<VehiculoArchivo | null> {
        // findFirst (no findUnique) para poder filtrar por la relación padre.
        const where: any = { id, ...this.vehiculoScope() };
        const a = await prisma.vehiculoArchivo.findFirst({ where });
        return a ? this.mapToEntity(a) : null;
    }

    async create(data: any): Promise<VehiculoArchivo> {
        // El vehículo destino debe pertenecer al tenant (la extensión filtra Vehiculo por concesionariaId).
        const vehiculo = await prisma.vehiculo.findFirst({ where: { id: data.vehiculoId } });
        if (!vehiculo) throw new NotFoundException('Vehículo');
        const a = await prisma.vehiculoArchivo.create({ data });
        return this.mapToEntity(a);
    }

    async delete(id: number): Promise<void> {
        const where: any = { id, ...this.vehiculoScope() };
        await prisma.vehiculoArchivo.deleteMany({ where });
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
