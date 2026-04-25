import { IPresupuestoRepository } from '../../../domain/repositories/IPresupuestoRepository';
import { NotFoundException } from '../../../domain/exceptions/BaseException';
import { assertValidTransition } from '../../../domain/services/stateMachine';

export class UpdatePresupuesto {
    constructor(private readonly presupuestoRepository: IPresupuestoRepository) { }

    async execute(id: number, data: any) {
        const exists: any = await this.presupuestoRepository.findById(id);
        if (!exists) throw new NotFoundException('Presupuesto');

        if (data.estado && data.estado !== exists.estado) {
            assertValidTransition('presupuesto', exists.estado, data.estado);
        }

        return this.presupuestoRepository.update(id, data);
    }
}
