import { Request, Response, NextFunction } from 'express';
import { PrismaVehiculoArchivoRepository } from '../../infrastructure/database/repositories/PrismaVehiculoArchivoRepository';
import { GetArchivosByVehiculo } from '../../application/use-cases/vehiculo-archivos/GetArchivosByVehiculo';
import { CreateVehiculoArchivo } from '../../application/use-cases/vehiculo-archivos/CreateVehiculoArchivo';
import { DeleteVehiculoArchivo } from '../../application/use-cases/vehiculo-archivos/DeleteVehiculoArchivo';

const repository = new PrismaVehiculoArchivoRepository();
const getByVehiculoUC = new GetArchivosByVehiculo(repository);
const createUC = new CreateVehiculoArchivo(repository);
const deleteUC = new DeleteVehiculoArchivo(repository);

export class VehiculoArchivoController {
    static async getByVehiculo(req: Request, res: Response, next: NextFunction) {
        try {
            const vehiculoId = parseInt(req.params.vehiculoId as string, 10);
            const result = await getByVehiculoUC.execute(vehiculoId);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await createUC.execute(req.body);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id as string, 10);
            await deleteUC.execute(id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}
