import { Request, Response, NextFunction } from 'express';
import { PrismaPresupuestoRepository } from '../../infrastructure/database/repositories/PrismaPresupuestoRepository';
import { GetPresupuestos } from '../../application/use-cases/presupuestos/GetPresupuestos';
import { GetPresupuestoById } from '../../application/use-cases/presupuestos/GetPresupuestoById';
import { CreatePresupuesto } from '../../application/use-cases/presupuestos/CreatePresupuesto';
import { UpdatePresupuesto } from '../../application/use-cases/presupuestos/UpdatePresupuesto';
import { DeletePresupuesto } from '../../application/use-cases/presupuestos/DeletePresupuesto';

const repository = new PrismaPresupuestoRepository();
const getPresupuestosUC = new GetPresupuestos(repository);
const getPresupuestoByIdUC = new GetPresupuestoById(repository);
const createPresupuestoUC = new CreatePresupuesto(repository);
const updatePresupuestoUC = new UpdatePresupuesto(repository);
const deletePresupuestoUC = new DeletePresupuesto(repository);

export class PresupuestoController {
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const { limit, page, sortBy, sortOrder, ...filters } = req.query;
            const result = await getPresupuestosUC.execute(filters, { limit, page, sortBy, sortOrder } as any);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id as string, 10);
            const result = await getPresupuestoByIdUC.execute(id);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await createPresupuestoUC.execute(req.body);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id as string, 10);
            const result = await updatePresupuestoUC.execute(id, req.body);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id as string, 10);
            await deletePresupuestoUC.execute(id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}
