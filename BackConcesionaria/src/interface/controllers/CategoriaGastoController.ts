import { Request, Response, NextFunction } from 'express';
import { PrismaCategoriaGastoRepository } from '../../infrastructure/database/repositories/PrismaCategoriaGastoRepository';
import { GetCategoriasGasto } from '../../application/use-cases/gastos-categorias/GetCategoriasGasto';
import { CreateCategoriaGasto } from '../../application/use-cases/gastos-categorias/CreateCategoriaGasto';
import { DeleteCategoriaGasto } from '../../application/use-cases/gastos-categorias/DeleteCategoriaGasto';
import { context } from '../../infrastructure/security/context';

const repository = new PrismaCategoriaGastoRepository();
const getCategoriasUC = new GetCategoriasGasto(repository);
const createCategoriaUC = new CreateCategoriaGasto(repository);
const deleteCategoriaUC = new DeleteCategoriaGasto(repository);

export class CategoriaGastoController {
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const tenantId = context.getTenantId();
            const result = await getCategoriasUC.execute(tenantId!);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await createCategoriaUC.execute(req.body);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id as string, 10);
            await deleteCategoriaUC.execute(id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}
