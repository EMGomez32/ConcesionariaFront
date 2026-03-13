import { Request, Response } from 'express';
import * as usuarioService from './usuario.service';
import catchAsync from '../../utils/catchAsync';
import pick from '../../utils/pick';
import parseNumericFields from '../../utils/parseNumericFields';
import ApiResponse from '../../utils/ApiResponse';
import { requireSameTenant } from '../../utils/requireSameTenant';
import * as auditoriaService from '../auditoria/auditoria.service';

export const getUsuarios = catchAsync(async (req: Request, res: Response) => {
    let filter = pick(req.query, ['nombre', 'email', 'concesionariaId', 'sucursalId', 'activo']);
    const options = pick(req.query, ['sortBy', 'sortOrder', 'limit', 'page']);

    // Convert numeric fields from strings to numbers
    filter = parseNumericFields(filter, ['concesionariaId', 'sucursalId']);

    const user = req.user;
    if (user && !user.roles.includes('super_admin')) {
        filter.concesionariaId = user.concesionariaId;
    }

    const result = await usuarioService.getUsuarios(filter, options);
    res.send(ApiResponse.success(result.results, {
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        totalResults: result.totalResults,
    }));
});

export const getUsuario = catchAsync(async (req: Request, res: Response) => {
    const result = await usuarioService.getUsuarioById(parseInt(req.params.id as string, 10));

    requireSameTenant(req.user, result.concesionariaId);

    res.send(ApiResponse.success(result));
});

export const createUsuario = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    const data = req.body;

    if (user && !user.roles.includes('super_admin')) {
        data.concesionariaId = user.concesionariaId;
    }

    const result = await usuarioService.createUsuario(data);

    if (user) {
        await auditoriaService.createAuditLog({
            concesionariaId: user.concesionariaId as number,
            usuarioId: user.userId,
            entidad: 'Usuario',
            entidadId: result.id,
            accion: 'create',
            detalle: `Usuario ${result.nombre} creado`
        });
    }

    res.status(201).send(ApiResponse.success(result));
});

export const updateUsuario = catchAsync(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string, 10);
    const user = req.user;

    const current = await usuarioService.getUsuarioById(id);
    requireSameTenant(user, current.concesionariaId);

    const result = await usuarioService.updateUsuario(id, req.body);

    if (user) {
        await auditoriaService.createAuditLog({
            concesionariaId: user.concesionariaId as number,
            usuarioId: user.userId,
            entidad: 'Usuario',
            entidadId: id,
            accion: 'update',
            detalle: `Usuario ${id} actualizado`
        });
    }

    res.send(ApiResponse.success(result));
});

export const deleteUsuario = catchAsync(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string, 10);
    const user = req.user;

    const current = await usuarioService.getUsuarioById(id);
    requireSameTenant(user, current.concesionariaId);

    await usuarioService.deleteUsuario(id);

    if (user) {
        await auditoriaService.createAuditLog({
            concesionariaId: user.concesionariaId as number,
            usuarioId: user.userId,
            entidad: 'Usuario',
            entidadId: id,
            accion: 'delete_soft',
            detalle: `Usuario ${id} eliminado`
        });
    }

    res.send(ApiResponse.success({ message: 'Usuario eliminado con éxito' }));
});
