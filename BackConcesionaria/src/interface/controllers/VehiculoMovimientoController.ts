import { Request, Response, NextFunction } from 'express';
import { PrismaVehiculoMovimientoRepository } from '../../infrastructure/database/repositories/PrismaVehiculoMovimientoRepository';
import { GetMovimientos } from '../../application/use-cases/vehiculo-movimientos/GetMovimientos';
import { CreateMovimiento } from '../../application/use-cases/vehiculo-movimientos/CreateMovimiento';

const repository = new PrismaVehiculoMovimientoRepository();
const getMovimientosUC = new GetMovimientos(repository);
const createUC = new CreateMovimiento(repository);

export class VehiculoMovimientoController {
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const { limit, page, sortBy, sortOrder, ...filters } = req.query;
            const result = await getMovimientosUC.execute(filters, { limit, page, sortBy, sortOrder } as any);
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
}
