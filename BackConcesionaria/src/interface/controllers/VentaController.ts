import { Request, Response, NextFunction } from 'express';
import { PrismaVentaRepository } from '../../infrastructure/database/repositories/PrismaVentaRepository';
import { PrismaVehiculoRepository } from '../../infrastructure/database/repositories/PrismaVehiculoRepository';
import { GetVentas } from '../../application/use-cases/ventas/GetVentas';
import { GetVentaById } from '../../application/use-cases/ventas/GetVentaById';
import { CreateVenta } from '../../application/use-cases/ventas/CreateVenta';
import { DeleteVenta } from '../../application/use-cases/ventas/DeleteVenta';

const repository = new PrismaVentaRepository();
const vehiculoRepository = new PrismaVehiculoRepository();
const getVentasUC = new GetVentas(repository);
const getVentaByIdUC = new GetVentaById(repository);
const createVentaUC = new CreateVenta(repository, vehiculoRepository);
const deleteVentaUC = new DeleteVenta(repository);

export class VentaController {
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const { limit, page, sortBy, sortOrder, ...filters } = req.query;
            const result = await getVentasUC.execute(filters, { limit, page, sortBy, sortOrder } as any);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id as string, 10);
            const result = await getVentaByIdUC.execute(id);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await createVentaUC.execute(req.body);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id as string, 10);
            await deleteVentaUC.execute(id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}
