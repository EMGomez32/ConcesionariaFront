import { Request, Response, NextFunction } from 'express';
import { PrismaFinanciacionRepository } from '../../infrastructure/database/repositories/PrismaFinanciacionRepository';
import { GetFinanciaciones } from '../../application/use-cases/financiaciones/GetFinanciaciones';
import { GetFinanciacionById } from '../../application/use-cases/financiaciones/GetFinanciacionById';
import { CreateFinanciacion } from '../../application/use-cases/financiaciones/CreateFinanciacion';
import { RegistrarPagoCuota } from '../../application/use-cases/financiaciones/RegistrarPagoCuota';

const repository = new PrismaFinanciacionRepository();
const getFinanciacionesUC = new GetFinanciaciones(repository);
const getFinanciacionByIdUC = new GetFinanciacionById(repository);
const createFinanciacionUC = new CreateFinanciacion(repository);
const registrarPagoUC = new RegistrarPagoCuota(repository);

export class FinanciacionController {
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const { limit, page, sortBy, sortOrder, ...filters } = req.query;
            const result = await getFinanciacionesUC.execute(filters, { limit, page, sortBy, sortOrder } as any);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id as string, 10);
            const result = await getFinanciacionByIdUC.execute(id);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await createFinanciacionUC.execute(req.body);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    static async pagarCuota(req: Request, res: Response, next: NextFunction) {
        try {
            const cuotaId = parseInt(req.params.cuotaId as string, 10);
            const result = await registrarPagoUC.execute(cuotaId, req.body);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }
}
