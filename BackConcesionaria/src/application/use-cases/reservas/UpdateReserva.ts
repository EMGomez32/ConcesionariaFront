import { IReservaRepository } from '../../../domain/repositories/IReservaRepository';
import { NotFoundException } from '../../../domain/exceptions/BaseException';
import prisma from '../../../infrastructure/database/prisma';

export class UpdateReserva {
    constructor(private readonly reservaRepository: IReservaRepository) { }

    async execute(id: number, data: any) {
        const current = await this.reservaRepository.findById(id);
        if (!current) throw new NotFoundException('Reserva');

        return prisma.$transaction(async (tx) => {
            const updated = await tx.reserva.update({
                where: { id },
                data
            });

            if ((data.estado === 'cancelada' || data.estado === 'vencida') && current.estado === 'activa') {
                await tx.vehiculo.update({
                    where: { id: current.vehiculoId },
                    data: { estado: 'publicado' }
                });
            }

            return updated;
        });
    }
}
