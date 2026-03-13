import { Request, Response, NextFunction } from 'express';
import { PrismaProveedorRepository } from '../../infrastructure/database/repositories/PrismaProveedorRepository';
import { GetProveedores } from '../../application/use-cases/proveedores/GetProveedores';
import { CreateProveedor } from '../../application/use-cases/proveedores/CreateProveedor';

const repository = new PrismaProveedorRepository();
const getProveedoresUC = new GetProveedores(repository);
const createProveedorUC = new CreateProveedor(repository);

export class ProveedorController {
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const { limit, page, sortBy, sortOrder, ...filters } = req.query;
            const result = await getProveedoresUC.execute(filters, { limit, page, sortBy, sortOrder } as any);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await createProveedorUC.execute(req.body);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }
}
