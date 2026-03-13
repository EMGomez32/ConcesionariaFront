import { Request, Response, NextFunction } from 'express';
import { PrismaSolicitudFinanciacionRepository } from '../../infrastructure/database/repositories/PrismaSolicitudFinanciacionRepository';
import { GetSolicitudes } from '../../application/use-cases/financiacion-solicitudes/GetSolicitudes';
import { GetSolicitudById } from '../../application/use-cases/financiacion-solicitudes/GetSolicitudById';
import { CreateSolicitud } from '../../application/use-cases/financiacion-solicitudes/CreateSolicitud';
import { UpdateSolicitud } from '../../application/use-cases/financiacion-solicitudes/UpdateSolicitud';
import { DeleteSolicitud } from '../../application/use-cases/financiacion-solicitudes/DeleteSolicitud';

const repository = new PrismaSolicitudFinanciacionRepository();
const getSolicitudesUC = new GetSolicitudes(repository);
const getSolicitudByIdUC = new GetSolicitudById(repository);
const createSolicitudUC = new CreateSolicitud(repository);
const updateSolicitudUC = new UpdateSolicitud(repository);
const deleteSolicitudUC = new DeleteSolicitud(repository);

export class SolicitudFinanciacionController {
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const { limit, page, sortBy, sortOrder, ...filters } = req.query;
            const result = await getSolicitudesUC.execute(filters, { limit, page, sortBy, sortOrder } as any);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id as string, 10);
            const result = await getSolicitudByIdUC.execute(id);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await createSolicitudUC.execute(req.body);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id as string, 10);
            const result = await updateSolicitudUC.execute(id, req.body);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id as string, 10);
            await deleteSolicitudUC.execute(id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}
