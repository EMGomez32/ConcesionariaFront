import { IVehiculoRepository } from '../../../domain/repositories/IVehiculoRepository';
import { NotFoundException } from '../../../domain/exceptions/BaseException';

export class UpdateVehiculo {
    constructor(private readonly vehiculoRepository: IVehiculoRepository) { }

    async execute(id: number, data: any) {
        const exists = await this.vehiculoRepository.findById(id);
        if (!exists) {
            throw new NotFoundException('Vehículo');
        }
        return this.vehiculoRepository.update(id, data);
    }
}
