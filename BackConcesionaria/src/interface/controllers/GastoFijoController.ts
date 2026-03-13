import { Request, Response, NextFunction } from 'express';
import { PrismaGastoFijoRepository } from '../../infrastructure/database/repositories/PrismaGastoFijoRepository';
import { GetGastosFijos } from '../../application/use-cases/gastos-fijos/GetGastosFijos';
import { GetGastoFijoById } from '../../application/use-cases/gastos-fijos/GetGastoFijoById';
import { CreateGastoFijo } from '../../application/use-cases/gastos-fijos/CreateGastoFijo';
import { UpdateGastoFijo } from '../../application/use-cases/gastos-fijos/UpdateGastoFijo';
import { DeleteGastoFijo } from '../../application/use-cases/gastos-fijos/DeleteGastoFijo';

const repository = new PrismaGastoFijoRepository();
const getGastosUC = new GetGastosFijos(repository);
const getGastoByIdUC = new GetGastoFijoById(repository);
const createGastoUC = new CreateGastoFijo(repository);
const updateGastoUC = new UpdateGastoFijo(repository);
const deleteGastoUC = new DeleteGastoFijo(repository);

export class GastoFijoController {
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const { limit, page, sortBy, sortOrder, ...filters } = req.query;
            const result = await getGastosUC.execute(filters, { limit, page, sortBy, sortOrder } as any);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id as string, 10);
            const result = await getGastoByIdUC.execute(id);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await createGastoUC.execute(req.body);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id as string, 10);
            const result = await updateGastoUC.execute(id, req.body);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id as string, 10);
            await deleteGastoUC.execute(id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}
