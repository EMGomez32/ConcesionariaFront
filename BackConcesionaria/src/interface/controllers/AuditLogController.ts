import { Request, Response, NextFunction } from 'express';
import { PrismaAuditLogRepository } from '../../infrastructure/database/repositories/PrismaAuditLogRepository';
import { GetAuditLogs } from '../../application/use-cases/auditoria/GetAuditLogs';
import { GetAuditLogById } from '../../application/use-cases/auditoria/GetAuditLogById';

const repository = new PrismaAuditLogRepository();
const getAuditLogsUC = new GetAuditLogs(repository);
const getByIdUC = new GetAuditLogById(repository);

export class AuditLogController {
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const { limit, page, sortBy, sortOrder, ...filters } = req.query;
            const result = await getAuditLogsUC.execute(filters, { limit, page, sortBy, sortOrder } as any);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id as string, 10);
            const result = await getByIdUC.execute(id);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }
}
