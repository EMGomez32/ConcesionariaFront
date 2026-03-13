import { Request, Response, NextFunction } from 'express';
import { PrismaCategoriaGastoFijoRepository } from '../../infrastructure/database/repositories/PrismaCategoriaGastoFijoRepository';
import { GetCategoriasGastoFijo } from '../../application/use-cases/gastos-fijos-categorias/GetCategoriasGastoFijo';
import { CreateCategoriaGastoFijo } from '../../application/use-cases/gastos-fijos-categorias/CreateCategoriaGastoFijo';
import { DeleteCategoriaGastoFijo } from '../../application/use-cases/gastos-fijos-categorias/DeleteCategoriaGastoFijo';
import { context } from '../../infrastructure/security/context';

const repository = new PrismaCategoriaGastoFijoRepository();
const getCategoriasUC = new GetCategoriasGastoFijo(repository);
const createCategoriaUC = new CreateCategoriaGastoFijo(repository);
const deleteCategoriaUC = new DeleteCategoriaGastoFijo(repository);

export class CategoriaGastoFijoController {
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
