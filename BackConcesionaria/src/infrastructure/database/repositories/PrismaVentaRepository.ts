import { IVentaRepository } from '../../../domain/repositories/IVentaRepository';
import { Venta } from '../../../domain/entities/Venta';
import prisma from '../prisma';
import { QueryOptions, PaginatedResponse } from '../../../types/common';

export class PrismaVentaRepository implements IVentaRepository {
    async findAll(filter: any = {}, options: QueryOptions = {}): Promise<PaginatedResponse<Venta>> {
        const { limit = 20, page = 1, sortBy = 'createdAt', sortOrder = 'desc' } = options;
        const limitNum = Number(limit);
        const pageNum = Number(page);

        const results = await prisma.venta.findMany({
            where: filter,
            take: limitNum,
            skip: (pageNum - 1) * limitNum,
            orderBy: { [sortBy as string]: sortOrder },
            include: {
                cliente: true,
                vehiculo: true,
                vendedor: { select: { nombre: true, email: true } }
            }
        });

        const total = await prisma.venta.count({ where: filter });

        return {
            results: results.map(this.mapToEntity),
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
            totalResults: total,
        };
    }

    async findById(id: number): Promise<Venta | null> {
        const v = await prisma.venta.findUnique({
            where: { id },
            include: {
                cliente: true,
                vehiculo: true,
                extras: true,
                pagos: true,
                canjes: true,
                vendedor: true,
                presupuesto: true
            }
        });
        return v ? this.mapToEntity(v) : null;
    }

    async create(data: any): Promise<Venta> {
        const v = await prisma.venta.create({ data });
        return this.mapToEntity(v);
    }

    async createWithTransaction(data: any, tx: any): Promise<Venta> {
        const v = await tx.venta.create({ data });
        return this.mapToEntity(v);
    }

    async update(id: number, data: any): Promise<Venta> {
        const v = await prisma.venta.update({
            where: { id },
            data,
        });
        return this.mapToEntity(v);
    }

    async delete(id: number): Promise<void> {
        await prisma.venta.delete({ where: { id } });
    }

    private mapToEntity(v: any): Venta {
        return new Venta(
            v.id,
            v.concesionariaId,
            v.sucursalId,
            v.vehiculoId,
            v.clienteId,
            v.vendedorId,
            v.nroVenta,
            v.fecha,
            Number(v.precioVenta),
            v.estado,
            v.createdAt,
            v.updatedAt,
            v.deletedAt,
            v.cliente,
            v.vehiculo,
            v.vendedor
        );
    }
}
