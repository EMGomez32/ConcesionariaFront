import { Request, Response, NextFunction } from 'express';
import { PrismaGastoRepository } from '../../infrastructure/database/repositories/PrismaGastoRepository';
import { GetGastos } from '../../application/use-cases/gastos/GetGastos';
import { GetGastoById } from '../../application/use-cases/gastos/GetGastoById';
import { CreateGasto } from '../../application/use-cases/gastos/CreateGasto';
import { UpdateGasto } from '../../application/use-cases/gastos/UpdateGasto';
import { DeleteGasto } from '../../application/use-cases/gastos/DeleteGasto';

const repository = new PrismaGastoRepository();
const getGastosUC = new GetGastos(repository);
const getGastoByIdUC = new GetGastoById(repository);
const createGastoUC = new CreateGasto(repository);
const updateGastoUC = new UpdateGasto(repository);
const deleteGastoUC = new DeleteGasto(repository);

export class GastoController {
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
