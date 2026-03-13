import { Request, Response, NextFunction } from 'express';
import { PrismaVehiculoRepository } from '../../infrastructure/database/repositories/PrismaVehiculoRepository';
import { GetVehiculos } from '../../application/use-cases/vehiculos/GetVehiculos';
import { GetVehiculoById } from '../../application/use-cases/vehiculos/GetVehiculoById';
import { CreateVehiculo } from '../../application/use-cases/vehiculos/CreateVehiculo';
import { UpdateVehiculo } from '../../application/use-cases/vehiculos/UpdateVehiculo';
import { DeleteVehiculo } from '../../application/use-cases/vehiculos/DeleteVehiculo';

const repository = new PrismaVehiculoRepository();
const getVehiculosUC = new GetVehiculos(repository);
const getVehiculoByIdUC = new GetVehiculoById(repository);
const createVehiculoUC = new CreateVehiculo(repository);
const updateVehiculoUC = new UpdateVehiculo(repository);
const deleteVehiculoUC = new DeleteVehiculo(repository);

export class VehiculoController {
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const { limit, page, sortBy, sortOrder, ...filters } = req.query;
            const result = await getVehiculosUC.execute(filters, { limit, page, sortBy, sortOrder } as any);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id as string, 10);
            const result = await getVehiculoByIdUC.execute(id);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await createVehiculoUC.execute(req.body);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id as string, 10);
            const result = await updateVehiculoUC.execute(id, req.body);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id as string, 10);
            await deleteVehiculoUC.execute(id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}
