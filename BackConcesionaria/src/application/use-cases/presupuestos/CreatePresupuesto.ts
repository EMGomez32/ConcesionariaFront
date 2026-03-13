import { IPresupuestoRepository } from '../../../domain/repositories/IPresupuestoRepository';

export class CreatePresupuesto {
    constructor(private readonly presupuestoRepository: IPresupuestoRepository) { }

    async execute(data: any) {
        return this.presupuestoRepository.create(data);
    }
}
