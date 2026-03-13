import { Request, Response, NextFunction } from 'express';
import { PrismaUsuarioRepository } from '../../infrastructure/database/repositories/PrismaUsuarioRepository';
import { GetUsuarios } from '../../application/use-cases/usuarios/GetUsuarios';
import { GetUsuarioById } from '../../application/use-cases/usuarios/GetUsuarioById';
import { CreateUsuario } from '../../application/use-cases/usuarios/CreateUsuario';
import { UpdateUsuario } from '../../application/use-cases/usuarios/UpdateUsuario';
import { DeleteUsuario } from '../../application/use-cases/usuarios/DeleteUsuario';
import { cleanFilters } from '../../utils/cleanFilters';

const repository = new PrismaUsuarioRepository();
const getUsuariosUC = new GetUsuarios(repository);
const getUsuarioByIdUC = new GetUsuarioById(repository);
const createUsuarioUC = new CreateUsuario(repository);
const updateUsuarioUC = new UpdateUsuario(repository);
const deleteUsuarioUC = new DeleteUsuario(repository);

export class UsuarioController {
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const { limit, page, sortBy, sortOrder, ...filters } = req.query;
            const result = await getUsuariosUC.execute(cleanFilters(filters), { limit, page, sortBy, sortOrder } as any);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id as string, 10);
            const result = await getUsuarioByIdUC.execute(id);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await createUsuarioUC.execute(req.body);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id as string, 10);
            const result = await updateUsuarioUC.execute(id, req.body);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id as string, 10);
            await deleteUsuarioUC.execute(id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}
