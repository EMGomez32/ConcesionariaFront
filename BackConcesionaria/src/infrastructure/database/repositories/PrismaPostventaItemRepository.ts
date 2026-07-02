import { IPostventaItemRepository } from '../../../domain/repositories/IPostventaItemRepository';
import { PostventaItem } from '../../../domain/entities/PostventaItem';
import { NotFoundException } from '../../../domain/exceptions/BaseException';
import prisma from '../prisma';
import { context } from '../../security/context';

export class PrismaPostventaItemRepository implements IPostventaItemRepository {
    // PostventaItem NO tiene concesionariaId propio: se aísla por el caso padre.
    // super_admin => sin filtro. Usuario normal => el caso debe pertenecer a su concesionaria.
    private casoScope(): any {
        const tenantId = context.getTenantId();
        return context.isSuperAdmin() ? {} : { caso: { concesionariaId: tenantId } };
    }

    async findByCaso(casoId: number): Promise<PostventaItem[]> {
        const where: any = { casoId, ...this.casoScope() };
        const results = await prisma.postventaItem.findMany({
            where,
            orderBy: { createdAt: 'asc' }
        });
        return results.map(this.mapToEntity);
    }

    async findById(id: number): Promise<PostventaItem | null> {
        // findFirst (no findUnique) para poder filtrar por la relación padre.
        const where: any = { id, ...this.casoScope() };
        const i = await prisma.postventaItem.findFirst({ where });
        return i ? this.mapToEntity(i) : null;
    }

    async create(data: any): Promise<PostventaItem> {
        // El caso destino debe pertenecer al tenant (la extensión filtra PostventaCaso por concesionariaId).
        const caso = await prisma.postventaCaso.findFirst({ where: { id: data.casoId } });
        if (!caso) throw new NotFoundException('Caso de postventa');
        const i = await prisma.postventaItem.create({ data });
        return this.mapToEntity(i);
    }

    async delete(id: number): Promise<void> {
        // deleteMany con scope: no borra items de otros tenants aunque se itere el id.
        const where: any = { id, ...this.casoScope() };
        await prisma.postventaItem.deleteMany({ where });
    }

    private mapToEntity(i: any): PostventaItem {
        return new PostventaItem(i.id, i.casoId, i.descripcion, Number(i.monto), i.cantidad, i.createdAt, i.updatedAt);
    }
}
