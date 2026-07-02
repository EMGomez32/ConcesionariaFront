import { Request, Response, NextFunction } from 'express';
import { context } from '../../infrastructure/security/context';
import { ForbiddenException } from '../../domain/exceptions/BaseException';

export const authorize = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = context.getUser();
        if (!user) {
            throw new ForbiddenException('User context missing');
        }

        // super_admin (dueño del SaaS) es el ÚNICO bypass global, explícito y auditable.
        // Se eliminó el bypass implícito de 'admin', que dejaba pasar a CUALQUIER admin
        // a CUALQUIER chequeo de rol (p.ej. rutas super_admin-only).
        const hasRole = user.roles.includes('super_admin') || roles.some(role => user.roles.includes(role));
        if (!hasRole) {
            throw new ForbiddenException(`Access denied. Required roles: ${roles.join(', ')}`);
        }
        next();
    };
};
