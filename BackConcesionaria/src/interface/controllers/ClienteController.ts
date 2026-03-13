import { Request, Response, NextFunction } from 'express';
import { PrismaClienteRepository } from '../../infrastructure/database/repositories/PrismaClienteRepository';
import { GetClientes } from '../../application/use-cases/clientes/GetClientes';
import { GetClienteById } from '../../application/use-cases/clientes/GetClienteById';
import { CreateCliente } from '../../application/use-cases/clientes/CreateCliente';
import { UpdateCliente } from '../../application/use-cases/clientes/UpdateCliente';
import { DeleteCliente } from '../../application/use-cases/clientes/DeleteCliente';
import { cleanFilters } from '../../utils/cleanFilters';
import parseNumericFields from '../../utils/parseNumericFields';

const repository = new PrismaClienteRepository();
const getClientesUC = new GetClientes(repository);
const getClienteByIdUC = new GetClienteById(repository);
const createClienteUC = new CreateCliente(repository);
const updateClienteUC = new UpdateCliente(repository);
const deleteClienteUC = new DeleteCliente(repository);

export class ClienteController {
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const { limit, page, sortBy, sortOrder, ...filters } = req.query;
            // Limpiar filtros vacíos y convertir campos numéricos
            const cleanedFilters = cleanFilters(filters);
            const parsedFilters = parseNumericFields(cleanedFilters, ['concesionariaId']);
            const result = await getClientesUC.execute(parsedFilters, { limit, page, sortBy, sortOrder } as any);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id as string, 10);
            const result = await getClienteByIdUC.execute(id);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            // Convertir campos numéricos del body
            const data = parseNumericFields(req.body, ['concesionariaId']);
            const result = await createClienteUC.execute(data);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id as string, 10);
            // Convertir campos numéricos del body
            const data = parseNumericFields(req.body, ['concesionariaId']);
            const result = await updateClienteUC.execute(id, data);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id as string, 10);
            await deleteClienteUC.execute(id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}
