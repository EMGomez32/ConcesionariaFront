import { IReservaRepository } from '../../../domain/repositories/IReservaRepository';
import { NotFoundException } from '../../../domain/exceptions/BaseException';
import prisma from '../../../infrastructure/database/prisma';

export class DeleteReserva {
    constructor(private readonly reservaRepository: IReservaRepository) { }

    async execute(id: number) {
        const current = await this.reservaRepository.findById(id);
        if (!current) throw new NotFoundException('Reserva');

        return prisma.$transaction(async (tx) => {
            if (current.estado === 'activa') {
                await tx.vehiculo.update({
                    where: { id: current.vehiculoId },
                    data: { estado: 'publicado' }
                });
            }
            return tx.reserva.delete({ where: { id } });
        });
    }
}
