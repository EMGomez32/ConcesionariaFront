import { IPresupuestoRepository } from '../../../domain/repositories/IPresupuestoRepository';
import { NotFoundException } from '../../../domain/exceptions/BaseException';

export class UpdatePresupuesto {
    constructor(private readonly presupuestoRepository: IPresupuestoRepository) { }

    async execute(id: number, data: any) {
        const exists = await this.presupuestoRepository.findById(id);
        if (!exists) throw new NotFoundException('Presupuesto');
        return this.presupuestoRepository.update(id, data);
    }
}
